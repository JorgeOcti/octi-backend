import { GoogleGenerativeAI } from '@google/generative-ai';
import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import ParticipantModel from '../../../models/participant.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';

const GEMINI_MODEL = 'gemini-3-flash-preview';

export default class GeminiCargoExtractionTriggerDelegate extends NullTriggerDelegate {

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
   * Executes the Gemini cargo extraction trigger: reads the answer for the configured question ID,
   * calls Gemini using the prompt stored in config, and saves the result to participant.carryResume.
   * @param trigger - The trigger definition including config.questionId and config.prompt
   * @param answers - Map of answer IDs to values (unused directly; answer is resolved from participant sections)
   * @param payload - Accumulated trigger payload including participant data
   * @returns Updated payload with carryResume field
   */
  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): Promise<IAnyObject> {
    try {
      logger.info(`GeminiCargoExtractionTriggerDelegate.trigger: performing`);

      const questionId: string = trigger.config.questionId;
      const prompt: string = trigger.config.prompt;

      if (!questionId) {
        logger.error(`GeminiCargoExtractionTriggerDelegate.trigger: config.questionId is required`);
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

      const answer = participant.sections
        .flatMap((section: IAnyObject) => section.answers)
        .find((a: IAnyObject) => a._id.toString() === questionId);

      const commentText: string = answer?.comment?.trim();
      if (!commentText) {
        logger.info(`GeminiCargoExtractionTriggerDelegate.trigger: no answer found for questionId "${questionId}", skipping`);
        return payload;
      }

      logger.debug(`GeminiCargoExtractionTriggerDelegate.trigger: calling Gemini for participant ${participant._id}`);
      const extraction = await this.callGemini(commentText.trim(), prompt);
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
