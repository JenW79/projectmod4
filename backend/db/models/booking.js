'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId' });
      Booking.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Booking.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStartDate(value) {
          if (value <= this.startDate) {
            throw new Error('End date must be after start date.');
          }
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    hooks: {
      beforeCreate: async (booking) => {
        const existingBooking = await Booking.findOne({
          where: {
            spotId: booking.spotId,
            [sequelize.Op.or]: [
              {
                startDate: { [sequelize.Op.between]: [booking.startDate, booking.endDate] },
              },
              {
                endDate: { [sequelize.Op.between]: [booking.startDate, booking.endDate] },
              },
            ],
          },
        });
        if (existingBooking) {
          throw new Error('Booking dates overlap with an existing booking.');
        }
      },
    },
  }
);

return Booking;
};