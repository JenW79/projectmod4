const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Review, Spot, User } = require('../../db/models');
const { check } = require('express-validator');

const router = express.Router();

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

// Create a new review (authenticated)
router.post(
  '/spot/:spotId',
  requireAuth,
  [
    check('review')
      .exists({ checkFalsy: true })
      .withMessage('Review text is required'),
    check('stars')
      .isInt({ min: 1, max: 5 })
      .withMessage('Stars must be an integer from 1 to 5'),
  ],
  async (req, res, next) => {
    const { spotId } = req.params;
    const { review, stars } = req.body;

    const newReview = await Review.create({
      spotId,
      userId: req.user.id,
      review,
      stars,
    });

    res.status(201).json(newReview);
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
