const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Booking, Spot } = require('../../db/models');
const { check } = require('express-validator');

const router = express.Router();

// Get all bookings for a user
router.get('/', requireAuth, async (req, res) => {
  const bookings = await Booking.findAll({
    where: { userId: req.user.id },
    include: { model: Spot, attributes: ['id', 'name', 'address'] },
  });

  res.json({ bookings });
});

// Create a new booking for a spot
router.post(
  '/spot/:spotId',
  requireAuth,
  [
    check('startDate')
      .isDate()
      .withMessage('Start date must be a valid date'),
    check('endDate')
      .isDate()
      .withMessage('End date must be a valid date'),
  ],
  async (req, res, next) => {
    const { spotId } = req.params;
    const { startDate, endDate } = req.body;

    const newBooking = await Booking.create({
      spotId,
      userId: req.user.id,
      startDate,
      endDate,
    });

    res.status(201).json(newBooking);
  }
);

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
