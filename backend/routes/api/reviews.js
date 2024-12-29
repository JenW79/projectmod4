const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Sequelize, Review, Spot, User, Image } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

// Get all reviews by the current user
router.get('/current', requireAuth, async (req, res, next) => {
  const currentUserId = req.user.id;

  try {
    const reviews = await Review.findAll({
      where: { userId: currentUserId }, // Filter reviews by the current user
      include: [
        // Include associated User data
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
        // Include associated Spot data
        {
          model: Spot,
          attributes: [
            'id',
            'ownerId',
            'address',
            'city',
            'state',
            'country',
            'lat',
            'lng',
            'name',
            'price',
          ],
          include: [
            {
              model: Image,
              as: 'SpotImages', // Alias for associated Images
              attributes: ['url'], // Get the URL for the preview image
            },
          ],
        },
        // Include associated ReviewImages
        {
          model: Image,
          as: 'ReviewImages', // Alias for associated Review Images
          attributes: ['id', 'url'],
        },
      ],
      attributes: [
        'id',
        'userId',
        'spotId',
        'review',
        'stars',
        'createdAt',
        'updatedAt',
      ],
    });

    // Add previewImage manually for each Spot
    const response = reviews.map((review) => {
      const spot = review.Spot;
      let previewImage = null;
      if (spot && spot.SpotImages && spot.SpotImages.length > 0) {
        previewImage = spot.SpotImages[0].url; // Use the first image as the preview
      }
      return {
        ...review.toJSON(),
        Spot: {
          ...spot.toJSON(),
          previewImage,
        },
      };
    });

    res.json({ Reviews: response });
  } catch (error) {
    next(error);
  }
});

// Get all reviews by Spot ID
router.get('/spot/:spotId', async (req, res, next) => {
  const { spotId } = req.params;

  const reviews = await Review.findAll({
    where: { spotId },
    include: [
      { model: User, attributes: ['id', 'username'] },
      { model: Spot, attributes: ['id', 'name'] },
    ],
  });

  if (!reviews.length) {
    const err = new Error("No reviews found for this spot");
    err.status = 404;
    return next(err);
  }

  res.json({ reviews });
});

router.post(
  '/:reviewId/images',
  requireAuth,
  async (req, res, next) => {
    const { reviewId } = req.params;
    const { url } = req.body;

    try {
      // Check if the review exists
      const review = await Review.findByPk(reviewId);
      if (!review) {
        const err = new Error("Review couldn't be found");
        err.status = 404;
        return next(err);
      }

      // Ensure the authenticated user owns the review
      if (review.userId !== req.user.id) {
        const err = new Error('Unauthorized to add an image to this review');
        err.status = 403;
        return next(err);
      }

      // Count existing images for the review
      const imageCount = await Image.count({ where: { reviewId } });
      if (imageCount >= 10) {
        const err = new Error('Maximum number of images for this resource was reached');
        err.status = 403;
        return next(err);
      }

      // Create the image
      const newImage = await Image.create({
        reviewId,
        url,
        userId: req.user.id, 
      });

      // Return the newly created image
      res.status(201).json({
        id: newImage.id,
        url: newImage.url,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Delete a review (authenticated)
router.delete('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findByPk(id);

  if (!review) {
    const err = new Error("Review couldn't be found");
    err.status = 404;
    return next(err);
  }

  if (review.userId !== req.user.id) {
    const err = new Error('Unauthorized');
    err.status = 403;
    return next(err);
  }

  await review.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
