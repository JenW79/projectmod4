const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const { spotValidation } = require('../../utils/validation');
const { Sequelize, Spot, Review, Image, User } = require('../../db/models');


const router = express.Router();

// Get all spots
router.get('/', async (req, res, next) => {
  try {
    const spots = await Spot.findAll({
      attributes: {
        include: [
          // Calculate the average rating for each spot
          [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'],
          // Include the URL of the preview image
          [Sequelize.col('Images.url'), 'previewImage'],
        ],
      },
      include: [
        // Join with Reviews to calculate avgRating
        { model: Review, attributes: [] },
        // Join with Images to get previewImage
        { model: Image, attributes: [] },
      ],
      group: ['Spot.id'], // Group by Spot ID to ensure the calculations work
    });

    // Send the spots as a JSON response
    res.json({ spots });
  } catch (err) {
    next(err); // Pass errors to the error handler middleware
  }
});

module.exports = router;

// Get spots created by the current user (authenticated)
router.get('/current', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const spots = await Spot.findAll({
      where: { ownerId: userId },
      attributes: {
          include: [
              [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'],
              [Sequelize.col('Images.url'), 'previewImage'],
          ],
      },
      include: [
          { model: Review, attributes: [] },
          { model: Image, attributes: [] },
      ],
      group: ['Spot.id'],
  });

  res.json({ spots });
});

// Get spot by spot id
router.get('/:spotId', async (req, res, next) => {
  const { spotId } = req.params;

  try {
    // Find the spot with aggregate data and associations
    const spot = await Spot.findByPk(spotId, {
      attributes: [
        'id', 'ownerId', 'address', 'city', 'state', 'country', 
        'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt',
        [Sequelize.fn('COUNT', Sequelize.col('Reviews.id')), 'numReviews'],
        [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgStarRating'],
      ],
      include: [
        // Include SpotImages association
        {
          model: Image,
          as: 'SpotImages',
          attributes: ['id', 'url', 'preview'],
        },
        // Include Owner association
        {
          model: User,
          as: 'Owner',
          attributes: ['id', 'firstName', 'lastName'],
        },
        // Include Reviews for aggregate data
        {
          model: Review,
          attributes: [],
        },
      ],
      group: ['Spot.id', 'SpotImages.id', 'Owner.id'],
    });

    // If the spot does not exist, return a 404 error
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

// Update a spot (authenticated)
router.put('/:id', requireAuth, async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.id);

  if (!spot) {
    const err = new Error("Spot couldn't be found");
    err.status = 404;
    return next(err);
  }

  const { name, description, price, lat, lng, address, city, state, country } = req.body;
  spot.set({ name, description, city, state, country, lat, lng, address, price });
  await spot.save();

  res.json(spot);
});

// Delete a spot (authenticated)
router.delete('/:id', requireAuth, async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.id);

  if (!spot) {
    const err = new Error("Spot couldn't be found");
    err.status = 404;
    return next(err);
  }

  await spot.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
