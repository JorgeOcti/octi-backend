import { GoogleGenerativeAI } from '@google/generative-ai';
import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import ParticipantModel from '../../../models/participant.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';

const GEMINI_MODEL = 'gemini-2.5-flash';
const AVERAGE = 15;

const GEMINI_PROMPT = `You are an expert logistics coordinator analyzing cargo descriptions in Spanish.
Your goal is to extract item counts and damage reports into a structured JSON format.

RULES:
1. Identify "elements" (e.g., pallets, racks, containers, camioneta, auto, moto), this are things that can contain other things, excluding boxes or things that are not the on the biggest picture.
2. Determine if there is ANY reported damage or anomaly (has_damage: boolean).
3. Extract relevant extra details into a "notes" field (e.g., patent numbers, "film en mal estado", "zunchos sueltos").
4. DO NOT invent information. Only extract what is explicitly stated or can be directly calculated from the text.
5. If there is no way to get a elements number put ${AVERAGE} and add on notes "rellenado por promedio".
6. If a piece of information is missing, use null or 0 or an empty list.
7. Return ONLY valid JSON.

JSON SCHEMA:
{
  "elements": number,
  "has_damage": boolean,
  "notes": "string"
}

FEW-SHOT EXAMPLES (HOTSHOTS):

Input: "lincha"
Output: {
  "elements": ${AVERAGE},
  "has_damage": false,
  "notes": "Rellenado por promedio"
}

Input: ""
Output: {
  "elements": ${AVERAGE},
  "has_damage": false,
  "notes": "Rellenado por promedio"
}

Input: "una moto patente M7 84681"
Output: {
  "elements": 1,
  "has_damage": false,
  "notes": "patente M7 84681"
}

Input: "20 pallet de 40 sacos cada uno total: 800 sacos , film de pallet en mal estado"
Output: {
  "elements": 20,
  "has_damage": true,
  "notes": "film de pallet en mal estado"
}

Input: "13 motos\\n16 cajones"
Output: {
  "elements": 14,
  "has_damage": false,
  "notes": ""
}

Input: "20 pallet\\n48 sacos x pallet\\n2 sacos rotos"
Output: {
  "elements": 20,
  "has_damage": true,
  "notes": "2 sacos rotos"
}

Input: "19 pallet de 48 sacos y un pallet de 47 \\ntotal: 959 sacos\\npallet sin film y zunchos sueltos \\n8 sacos dañados y un saco derramo completo"
Output: {
  "elements": 20,
  "has_damage": true,
  "notes": "pallet sin film y zunchos sueltos, 8 sacos dañados and un saco derramo completo"
}

Input: "8 paqutes LP"
Output: {
  "elements": 8,
  "has_damage": false,
  "notes": "LP"
}

Input: "12 bultos, 1 pallet con carga suelta"
Output: {
  "elements": 13,
  "has_damage": false,
  "notes": "carga suelta"
}
`;

export default class AiExtractionTriggerDelegate extends NullTriggerDelegate {

  /**
   * Finds the comment text of the first text-kind answer matching the given question name.
   * @param sections - Participant sections containing answers
   * @param questionName - The question or shortName to match
   * @returns The trimmed comment string, or null if not found
   */
  private findTextAnswer(sections: IAnyObject[], questionName: string): string | null {
    for (const section of sections) {
      for (const answer of (section.answers ?? [])) {
        if (answer.kind !== 'text') continue;
        const matchesName = answer.question === questionName || answer.shortName === questionName;
        if (matchesName && answer.comment && answer.comment.trim().length > 0) {
          return answer.comment.trim();
        }
      }
    }
    return null;
  }

  /**
   * Calls the Gemini API with the given text and returns parsed extraction JSON.
   * @param text - The cargo description text
   * @returns Parsed extraction object with elements, has_damage, and notes
   */
  private async callGemini(text: string): Promise<IAnyObject> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('GEMINI_API_KEY is not set in environment');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(`${GEMINI_PROMPT}\n\n${text}`);
    const responseText = result.response.text().trim();

    const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  }

  /**
   * Executes the AI extraction trigger: reads a text answer from the participant,
   * calls Gemini to extract structured cargo data, and saves it to participant.carryResume.
   * @param trigger - The trigger definition including config.questionName
   * @param answers - Map of answer IDs to values
   * @param payload - Accumulated trigger payload including participant data
   * @returns Updated payload with carryResume field
   */
  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): Promise<IAnyObject> {
    try {
      logger.info(`AiExtractionTriggerDelegate.trigger: performing`);

      const context = this.processTrigerConfig(trigger, { ...answers, ...payload });
      const questionName: string = context.questionName;

      if (!questionName) {
        logger.error(`AiExtractionTriggerDelegate.trigger: config.questionName is required`);
        return payload;
      }

      const participant = payload.participant;
      if (!participant) {
        logger.error(`AiExtractionTriggerDelegate.trigger: participant not found in payload`);
        return payload;
      }

      const commentText = this.findTextAnswer(participant.sections ?? [], questionName);
      if (!commentText) {
        logger.info(`AiExtractionTriggerDelegate.trigger: no matching text answer found for question "${questionName}", skipping`);
        return payload;
      }

      logger.debug(`AiExtractionTriggerDelegate.trigger: calling Gemini for participant ${participant._id}`);
      const extraction = await this.callGemini(commentText);
      logger.debug(`AiExtractionTriggerDelegate.trigger: extraction => ${JSON.stringify(extraction)}`);

      await ParticipantModel.updateOne(
        { _id: participant._id },
        { $set: { carryResume: extraction } }
      );

      logger.info(`AiExtractionTriggerDelegate.trigger: carryResume saved for participant ${participant._id}`);

      return { ...payload, carryResume: extraction };
    } catch (e) {
      logger.error(e);
      return payload;
    }
  }
}
