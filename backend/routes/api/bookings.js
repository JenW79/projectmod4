const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Booking, Spot, User, Image } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const Sequelize = require('sequelize');

const router = express.Router();

// Get all bookings for the current user
router.get('/current', requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: {
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
            as: 'SpotImages',
            attributes: ['url'], 
            where: { preview: true },
            required: false, 
          },
        ],
      },
    });

    // Format the response to match API docs
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      Spot: {
        id: booking.Spot.id,
        ownerId: booking.Spot.ownerId,
        address: booking.Spot.address,
        city: booking.Spot.city,
        state: booking.Spot.state,
        country: booking.Spot.country,
        lat: booking.Spot.lat,
        lng: booking.Spot.lng,
        name: booking.Spot.name,
        price: booking.Spot.price,
        previewImage: booking.Spot.SpotImages[0]?.url || null,
      },
    }));

    res.json({ bookings: formattedBookings });
  } catch (err) {
    next(err);
  }
});

// Delete a booking
router.delete('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;

  const booking = await Booking.findByPk(id);

  if (!booking) {
    const err = new Error("Booking couldn't be found");
    err.status = 404;
    return next(err);
  }

  if (booking.userId !== req.user.id) {
    const err = new Error('Unauthorized');
    err.status = 403;
    return next(err);
  }

  await booking.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
