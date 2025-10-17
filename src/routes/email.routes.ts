import { Router, Request, Response } from 'express';
import { EmailAggregatorService } from '../services/email-aggregator.service';
import { SearchQuery, EmailCategory } from '../types';

export function createEmailRoutes(aggregator: EmailAggregatorService): Router {
  const router = Router();
  const esService = aggregator.getElasticsearchService();
  const ragService = aggregator.getRAGService();

  /**
   * @route GET /api/emails
   * @description Search and filter emails
   * @query {string} q - Search query
   * @query {string} folder - Filter by folder
   * @query {string} accountId - Filter by account
   * @query {string} category - Filter by category
   * @query {number} limit - Results per page (default: 50)
   * @query {number} offset - Pagination offset (default: 0)
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const query: SearchQuery = {
        query: req.query.q as string,
        folder: req.query.folder as string,
        accountId: req.query.accountId as string,
        category: req.query.category as EmailCategory,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await esService.searchEmails(query);

      res.json({
        success: true,
        data: {
          emails: result.emails,
          total: result.total,
          limit: query.limit,
          offset: query.offset
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @route GET /api/emails/:id
   * @description Get a specific email by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const email = await esService.getEmailById(req.params.id);

      if (!email) {
        return res.status(404).json({
          success: false,
          error: 'Email not found'
        });
      }

      res.json({
        success: true,
        data: email
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @route PUT /api/emails/:id/category
   * @description Update email category
   * @body {string} category - New category
   */
  router.put('/:id/category', async (req: Request, res: Response) => {
    try {
      const { category } = req.body;

      if (!Object.values(EmailCategory).includes(category)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
      }

      await esService.updateEmailCategory(req.params.id, category);

      res.json({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @route POST /api/emails/:id/suggest-reply
   * @description Get AI-powered reply suggestion for an email
   */
  router.post('/:id/suggest-reply', async (req: Request, res: Response) => {
    try {
      const email = await esService.getEmailById(req.params.id);

      if (!email) {
        return res.status(404).json({
          success: false,
          error: 'Email not found'
        });
      }

      const suggestion = await ragService.suggestReply(email);

      res.json({
        success: true,
        data: suggestion
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @route GET /api/emails/stats/categories
   * @description Get email count by category
   */
  router.get('/stats/categories', async (req: Request, res: Response) => {
    try {
      const categories = Object.values(EmailCategory);
      const stats: Record<string, number> = {};

      for (const category of categories) {
        const result = await esService.searchEmails({ category, limit: 0 });
        stats[category] = result.total;
      }

      res.json({
        success: true,
        data: stats
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
