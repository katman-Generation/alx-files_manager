import Express from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import UsersController from '../controllers/UsersController';
import xTokenAuth from './middlewares';

const router = Express.Router();
router.use(Express.json());

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', xTokenAuth, AuthController.getDisconnect);
router.get('/users/me', xTokenAuth, UsersController.getMe);
router.post('/files', xTokenAuth, FilesController.postUpload);
router.get('/files/:id', xTokenAuth, FilesController.getShow);
router.get('/files', xTokenAuth, FilesController.getIndex);
router.put('/files/:id/publish', xTokenAuth, FilesController.putPublish);
router.put('/files/:id/unpublish', xTokenAuth, FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export default router;