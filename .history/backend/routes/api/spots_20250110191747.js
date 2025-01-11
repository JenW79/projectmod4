const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { check, query } = require('express-validator');
const { spotValidation } = require('../../utils/validation');
const { Sequelize, Spot, Review, Image, User, Booking } = require('../../db/models');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');


const router = express.Router();



// Get all spots and with query filters
router.get('/', async (req, res, next) => {
  let {
    page = 1,
    size = 20,
    minLat,
    maxLat,
    minLng,
    maxLng,
    minPrice,
    maxPrice,
  } = req.query;
  const where = {};

  // Parse integers for page and size
  page = parseInt(page, 10);
  size = parseInt(size, 10);

  // Enforce defaults and limits
  if (isNaN(page) || page < 1) page = 1; // Default to page 1 if invalid
  if (isNaN(size) || size < 1 || size > 100) size = 20; // Default to size 20 if invalid

  const errors = [];
if (page < 1 || isNaN(page)) errors.push('Page must be a number greater than or equal to 1.');
if (size < 1 || isNaN(size)) errors.push('Size must be a number greater than or equal to 1.');
if (minPrice && minPrice < 0) errors.push('Minimum price must be greater than or equal to 0.');
if (maxPrice && maxPrice < 0) errors.push('Maximum price must be greater than or equal to 0.');

if (errors.length) {
  const err = new Error('Validation error');
  err.status = 400;
  err.errors = errors;
  return next(err);
}
const filters = {};
  if (minLat) filters.lat = { [Op.gte]: minLat };
  if (maxLat) filters.lat = { ...filters.lat, [Op.lte]: maxLat };
  if (minLng) filters.lng = { [Op.gte]: minLng };
  if (maxLng) filters.lng = { ...filters.lng, [Op.lte]: maxLng };
  if (minPrice) filters.price = { [Op.gte]: minPrice };
  if (maxPrice) filters.price = { ...filters.price, [Op.lte]: maxPrice }

  // Ensure valid pagination
  const limit = size;
  const offset = (page - 1) * size;
   
  try{
  const spots = await Spot.findAll({
    where: filters,
    limit,
    offset,
    include: [
      {
        model: Image,
        as: 'SpotImages',
        attributes: ['url'],
        where: { preview: true },
        required: false,
      },
    ],
  });

  // Format spots to include previewImage
  const formattedSpots = spots.map((spot) => {
    const spotData = spot.toJSON();
    return {
      ...spotData,
      previewImage: spotData.SpotImages?.[0]?.url || null,
    };
  });

  res.json({
    spots: formattedSpots,
    page: parseInt(page),
    size: parseInt(size),
  });
} catch (err) {
  next(err);
}
});


// Get spots created by the current user (authenticated)
router.get('/current', requireAuth, async (req, res, next) => {
  const userId = req.user.id;
 try{
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
    ],
    include: [
      { model: Review, as: 'Reviews', attributes: [] },
      { model: Image, as: 'SpotImages', attributes: ['url'] },
    ],
    group: ['Spot.id', 'SpotImages.id'],
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
        { model: Review, as: 'Reviews', attributes: [] },
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
      ownerId: req.user.id, 
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
        err.status = 500;
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
          as: 'ReviewImages', 
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

// Validation middleware for booking dates
const validateBooking = [
  check('startDate')
    .exists({ checkFalsy: true })
    .isDate()
    .withMessage('Start date must be a valid date'),
  check('endDate')
    .exists({ checkFalsy: true })
    .isDate()
    .withMessage('End date must be a valid date'),
  handleValidationErrors,
];

// Create a new booking for a spot
router.post(
  '/:spotId/bookings',
  requireAuth,
  validateBooking,
  async (req, res, next) => {
    const { spotId } = req.params;
    const { startDate, endDate } = req.body;

    try {
      // Find the spot by id
      const spot = await Spot.findByPk(spotId);

      // If the spot does not exist, return a 404 error
      if (!spot) {
        const err = new Error("Spot couldn't be found");
        err.status = 404;
        return next(err);
      }

      // Check if the user is the owner of the spot
      if (spot.ownerId === req.user.id) {
        const err = new Error('You cannot book your own spot.');
        err.status = 403;
        return next(err);
      }

      // Check for booking conflicts
      const existingBookings = await Booking.findAll({
        where: {
          spotId,
          [Sequelize.Op.or]: [
            {
              startDate: {
                [Sequelize.Op.lte]: endDate,
              },
              endDate: {
                [Sequelize.Op.gte]: startDate,
              },
            },
          ],
        },
      });

      if (existingBookings.length > 0) {
        const err = new Error('Spot is already booked for the specified dates.');
        err.status = 403;
        return next(err);
      }

      // Create the booking
      const newBooking = await Booking.create({
        spotId,
        userId: req.user.id,
        startDate,
        endDate,
      });

      // Return the newly created booking
      res.status(201).json(newBooking);
    } catch (error) {
      next(error);
    }
  }
);


// Get all bookings for a spot by spotId
router.get('/:spotId/bookings', requireAuth, async (req, res, next) => {
  try {
    const { spotId } = req.params;

    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      const err = new Error("Spot couldn't be found");
      err.status = 404;
      return next(err);
    }

    // Check if the current user is the owner of the spot
    const isOwner = spot.ownerId === req.user.id;

    const bookings = await Booking.findAll({
      where: { spotId },
      attributes: isOwner
        ? ['id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', 'updatedAt']
        : ['spotId', 'startDate', 'endDate'], // Non-owner gets limited fields
      include: isOwner
        ? [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName'], // Include user info for the owner
            },
          ]
        : [],
    });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
