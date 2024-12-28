const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const { spotValidation } = require('../../utils/validation');
const { Sequelize, Spot, Review, Image, User } = require('../../db/models');


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
      { model: Image, as: 'SpotImages', attributes: ['id', 'url', 'preview'] }, 
    ],
    group: ['Spot.id'],
  });

  res.json({ spots });
});

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

// Update a spot (authenticated)
router.put('/:spotId', requireAuth, async (req, res, next) => {
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
