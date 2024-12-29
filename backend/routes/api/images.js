const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Spot, Image } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const validateImage = [
  check('url')
    .exists({ checkFalsy: true })
    .withMessage('Image URL is required.'),
  check('preview')
    .isBoolean()
    .withMessage('Preview must be a boolean value.'),
  handleValidationErrors,
];

const router = express.Router();

// // Add an image to a spot
// router.post('/:spotId/images', requireAuth, validateImage, async (req, res, next) => {
//   const { spotId } = req.params;
//   const { url, preview } = req.body;

//   try {
//     // Check if the spot exists
//     const spot = await Spot.findByPk(spotId);

//     if (!spot) {
//       const err = new Error("Spot couldn't be found");
//       err.status = 404;
//       return next(err);
//     }

//      // Check if the authenticated user owns the spot
//      if (spot.ownerId !== req.user.id) {
//       const err = new Error('Forbidden: You are not authorized to add an image to this spot.');
//       err.status = 403;
//       return next(err);
//     }

//     // Create the image and associate it with the current user and spot
//     const newImage = await Image.create({
//       spotId,
//       userId: req.user.id, 
//       url,
//       preview,
//     });

//     // Send the response
//     res.status(201).json({
//       id: newImage.id,
//       url: newImage.url,
//       preview: newImage.preview,
//     });
//   } catch (err) {
//     next(err);
//   }
// });


// Delete an image (authenticated)
router.delete('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;

  const image = await Image.findByPk(id);

  if (!image) {
    const err = new Error("Image couldn't be found");
    err.status = 404;
    return next(err);
  }

  if (image.userId !== req.user.id) {
    const err = new Error('Unauthorized');
    err.status = 403;
    return next(err);
  }

  await image.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
