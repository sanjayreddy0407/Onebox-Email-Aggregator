import { Router, Request, Response } from 'express';
import { EmailAggregatorService } from '../services/email-aggregator.service';

export function createKnowledgeRoutes(aggregator: EmailAggregatorService): Router {
  const router = Router();
  const ragService = aggregator.getRAGService();

  /**
   * @route POST /api/knowledge
   * @description Add custom knowledge to the RAG system
   * @body {string} text - Knowledge text to add
   * @body {object} metadata - Optional metadata
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { text, metadata = {} } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      await ragService.addCustomKnowledge(text, metadata);

      res.json({
        success: true,
        message: 'Knowledge added successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
