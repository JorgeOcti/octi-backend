import { GoogleGenerativeAI } from '@google/generative-ai';
import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import ParticipantModel from '../../../models/participant.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';

const GEMINI_MODEL = 'gemini-3.0-flash';

export default class GeminiCargoExtractionTriggerDelegate extends NullTriggerDelegate {

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
   * Calls the Gemini API with the given text and prompt, returning parsed extraction JSON.
   * @param text - The cargo description text
   * @param prompt - The Gemini system prompt from trigger config
   * @returns Parsed extraction object with elements, has_damage, and notes
   */
  private async callGemini(text: string, prompt: string): Promise<IAnyObject> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('GEMINI_API_KEY is not set in environment');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(`${prompt}\n\n${text}`);
    const responseText = result.response.text().trim();

    const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  }

  /**
   * Executes the Gemini cargo extraction trigger: reads a text answer from the participant,
   * calls Gemini using the prompt stored in config, and saves the result to participant.carryResume.
   * @param trigger - The trigger definition including config.questionName and config.prompt
   * @param answers - Map of answer IDs to values
   * @param payload - Accumulated trigger payload including participant data
   * @returns Updated payload with carryResume field
   */
  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): Promise<IAnyObject> {
    try {
      logger.info(`GeminiCargoExtractionTriggerDelegate.trigger: performing`);

      const context = this.processTrigerConfig(trigger, { ...answers, ...payload });
      const questionName: string = context.questionName;
      const prompt: string = context.prompt;

      if (!questionName) {
        logger.error(`GeminiCargoExtractionTriggerDelegate.trigger: config.questionName is required`);
        return payload;
      }

      if (!prompt) {
        logger.error(`GeminiCargoExtractionTriggerDelegate.trigger: config.prompt is required`);
        return payload;
      }

      const participant = payload.participant;
      if (!participant) {
        logger.error(`GeminiCargoExtractionTriggerDelegate.trigger: participant not found in payload`);
        return payload;
      }

      const commentText = this.findTextAnswer(participant.sections ?? [], questionName);
      if (!commentText) {
        logger.info(`GeminiCargoExtractionTriggerDelegate.trigger: no matching text answer found for question "${questionName}", skipping`);
        return payload;
      }

      logger.debug(`GeminiCargoExtractionTriggerDelegate.trigger: calling Gemini for participant ${participant._id}`);
      const extraction = await this.callGemini(commentText, prompt);
      logger.debug(`GeminiCargoExtractionTriggerDelegate.trigger: extraction => ${JSON.stringify(extraction)}`);

      await ParticipantModel.updateOne(
        { _id: participant._id },
        { $set: { carryResume: extraction } }
      );

      logger.info(`GeminiCargoExtractionTriggerDelegate.trigger: carryResume saved for participant ${participant._id}`);

      return { ...payload, carryResume: extraction };
    } catch (e) {
      logger.error(e);
      return payload;
    }
  }
}
