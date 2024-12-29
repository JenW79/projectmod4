const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const { spotValidation } = require('../../utils/validation');
const { Sequelize, Spot, Review, Image, User } = require('../../db/models');
const { handleValidationErrors } = require('../../utils/validation');


const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const spots = await Spot.findAll({
      attributes: {
        include: [
          [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'],
          [Sequelize.col('SpotImages.url'), 'previewImage'],
        ],
      },
      include: [
        { model: Review, attributes: [] },
        { model: Image, as: 'SpotImages', attributes: [] },
      ],
      group: ['Spot.id'],
    });

    res.json({ spots });
  } catch (err) {
    next(err);
  }
});


module.exports = router;

// Get spots created by the current user (authenticated)
router.get('/current', requireAuth, async (req, res, next) => {
  const userId = req.user.id;

  try {
    const spots = await Spot.findAll({
      where: { ownerId: userId },
      attributes: [
        'id',
        'ownerId',
        'name',
        'address',
        'city',
        'state',
        'country',
        'lat',
        'lng',
        'description',
        'price',
        'createdAt',
        'updatedAt',
        [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'],
        [Sequelize.col('SpotImages.url'), 'previewImage'],
      ],
      include: [
        { model: Review, attributes: [] },
        { model: Image, as: 'SpotImages', attributes: [] },
      ],
      group: ['Spot.id'],
    });

    res.json({ spots });
  } catch (err) {
    next(err);
  }
})

//get spot by id
router.get('/:spotId', async (req, res, next) => {
  const { spotId } = req.params;

  try {
    const spot = await Spot.findByPk(spotId, {
      attributes: [
        'id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 
        'name', 'description', 'price', 'createdAt', 'updatedAt',
        [Sequelize.fn('COUNT', Sequelize.col('Reviews.id')), 'numReviews'],
        [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgStarRating'],
      ],
      include: [
        { model: Image, as: 'SpotImages', attributes: ['id', 'url', 'preview'] },
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: Review, attributes: [] },
      ],
      group: ['Spot.id', 'SpotImages.id', 'Owner.id'],
    });

    if (!spot) {
      const err = new Error("Spot couldn't be found");
      err.status = 404;
      return next(err);
    }

    const response = {
      id: spot.id,
      ownerId: spot.ownerId,
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: spot.lat,
      lng: spot.lng,
      name: spot.name,
      description: spot.description,
      price: spot.price,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
      numReviews: spot.getDataValue('numReviews'),
      avgStarRating: parseFloat(spot.getDataValue('avgStarRating')) || null,
      SpotImages: spot.SpotImages,
      Owner: spot.Owner,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});


// Create a spot (authenticated)
router.post(
  '/',
  requireAuth, 
  [
    check('name').exists({ checkFalsy: true }).withMessage('Name is required'),
    
  ], spotValidation,
  async (req, res, next) => {
    const { name, description, price, lat, lng, address, city, state, country } = req.body;

    const newSpot = await Spot.create({
      name,
      description,
      city,
      state,
      country,
      price,
      lat,
      lng,
      address,
      ownerId: req.user.id, // Attach the authenticated user
    });

    res.status(201).json(newSpot);
  }
);

/// Update a spot by the current user
router.put('/:spotId', requireAuth, spotValidation, async (req, res, next) => {
  const { spotId } = req.params;
  const { name, description, price, lat, lng, address, city, state, country } = req.body;

  try {
    // Find the spot by the given spotId
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      const err = new Error("Spot couldn't be found");
      err.status = 404;
      return next(err);
    }

    // Check if the current user is the owner of the spot
    if (spot.ownerId !== req.user.id) {
      const err = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }

    // Update the spot's details
    spot.set({
      name,
      description,
      price,
      lat,
      lng,
      address,
      city,
      state,
      country,
    });

    // Save the updated spot
    await spot.save();

    // Return the updated spot as the response
    res.status(200).json(spot);
  } catch (err) {
    next(err);
  }
});

// Delete a spot (authenticated)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const spot = await Spot.findByPk(req.params.id);

    if (!spot) {
      const err = new Error("Spot couldn't be found");
      err.status = 404;
      return next(err);
    }

    // Check if the current user is the owner of the spot
    if (spot.ownerId !== req.user.id) {
      const err = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }

    // If the user is the owner, delete the spot
    await spot.destroy();
    res.json({ message: 'Successfully deleted' });
  } catch (err) {
    next(err);
  }
});

// Add an image to a spot
router.post('/:spotId/images', requireAuth, async (req, res, next) => {
  const { spotId } = req.params;
  const { url, preview } = req.body;

  try {
    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      const err = new Error("Spot couldn't be found");
      err.status = 404;
      return next(err);
    }

    // Check if the authenticated user owns the spot
    if (spot.ownerId !== req.user.id) {
      const err = new Error('Forbidden: You are not authorized to add an image to this spot.');
      err.status = 403;
      return next(err);
    }

    // Create the new image
    const newImage = await Image.create({
      spotId,
      userId: req.user.id,
      url,
      preview,
    });

    res.status(201).json({
      id: newImage.id,
      url: newImage.url,
      preview: newImage.preview,
    });
  } catch (err) {
    next(err);
  }
});

// Create a new review (authenticated)
router.post(
  '/:spotId/reviews',
  requireAuth,
  [
    check('review')
      .exists({ checkFalsy: true })
      .withMessage('Review text is required'),
    check('stars')
      .isInt({ min: 1, max: 5 })
      .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    const { spotId } = req.params;
    const { review, stars } = req.body;

    try {
      // Check if the spot exists
      const spot = await Spot.findByPk(spotId);
      if (!spot) {
        const err = new Error("Spot couldn't be found");
        err.status = 404;
        return next(err);
      }

      // Check if the current user already reviewed the spot
      const existingReview = await Review.findOne({
        where: { spotId, userId: req.user.id },
      });
      if (existingReview) {
        const err = new Error('User has already reviewed this spot');
        err.status = 403;
        return next(err);
      }

      // Create a new review
      const newReview = await Review.create({
        spotId,
        userId: req.user.id,
        review,
        stars,
      });

      res.status(201).json(newReview);
    } catch (err) {
      next(err);
    }
  }
);
// Get all reviews for a specific spot
router.get('/:spotId/reviews', async (req, res, next) => {
  const { spotId } = req.params;

  try {
    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      const err = new Error("Spot couldn't be found");
      err.status = 404;
      return next(err);
    }

    // Fetch all reviews for the specified spot
    const reviews = await Review.findAll({
      where: { spotId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Image,
          as: 'ReviewImages', // Alias for Review Images
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

    res.json({ Reviews: reviews });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
