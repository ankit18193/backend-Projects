import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateFullname,
  updateEmail,
  updateAvatar,
  updateCoverImg,
  getUserChannelProfile,
  getWatchHistory,
  
} from '../controller/user.controller.js';
import { uploadVideo } from '../controller/video.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJwt } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  (req, res, next) => {
    console.log(req.files);
    next();
  },
  registerUser
);

router.route('/login').post(loginUser);

router.route('/logout').post(verifyJwt, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/current-user').post(verifyJwt, getCurrentUser);
router.route('change-password').post(verifyJwt, changePassword);
router.route('update-fullname').post(verifyJwt, updateFullname);
router.route('update-email').post(verifyJwt, updateEmail);
router.route('/avatar').patch(verifyJwt, upload.single('avatar'), updateAvatar);
router.route('/cover-image').patch(verifyJwt, upload.single('coverImage'), updateCoverImg);

router.route('/c/:username').get(verifyJwt, getUserChannelProfile);
router.route('/history').post(verifyJwt, getWatchHistory);

router.route('/upload-video').post(
  verifyJwt,
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    {
      name: 'thumbnail',
      maxCount: 1,
    },
  ]),
  uploadVideo
);

export default router;
