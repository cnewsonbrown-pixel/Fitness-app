import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as contentController from '../controllers/content.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

router.use(authenticate);
router.use(requireTenant);

// ===== PUBLIC CONTENT (authenticated members) =====

router.get('/feed', contentController.listPublishedArticles);
router.get('/categories', contentController.getCategories);
router.get('/announcements', contentController.listAnnouncements);

// Bookmarks
router.get('/bookmarks/:memberId', contentController.getBookmarks);
router.post('/articles/:id/bookmark', contentController.bookmarkArticle);
router.delete('/articles/:id/bookmark', contentController.removeBookmark);

// ===== ARTICLE MANAGEMENT (staff) =====

router.get('/articles', requireStaff(managerRoles), contentController.listArticles);
router.post('/articles', requireStaff(managerRoles), contentController.createArticle);
router.get('/articles/:id', contentController.getArticle);
router.patch('/articles/:id', requireStaff(managerRoles), contentController.updateArticle);
router.delete('/articles/:id', requireStaff(managerRoles), contentController.deleteArticle);

// ===== ANNOUNCEMENT MANAGEMENT (staff) =====

router.post('/announcements', requireStaff(managerRoles), contentController.createAnnouncement);
router.patch('/announcements/:id', requireStaff(managerRoles), contentController.updateAnnouncement);
router.delete('/announcements/:id', requireStaff(managerRoles), contentController.deleteAnnouncement);

export default router;
