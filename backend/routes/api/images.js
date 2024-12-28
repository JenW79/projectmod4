const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Image } = require('../../db/models');

const router = express.Router();

// Add an image to a Spot or Review
router.post('/', requireAuth, async (req, res, next) => {
  const { spotId, reviewId, url, status } = req.body;

  if (!spotId && !reviewId) {
    const err = new Error("You must provide either a spotId or a reviewId");
    err.status = 400;
    return next(err);
  }

  const newImage = await Image.create({
    spotId,
    reviewId,
    userId: req.user.id,
    url,
    status,
  });

  res.status(201).json(newImage);
});

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
