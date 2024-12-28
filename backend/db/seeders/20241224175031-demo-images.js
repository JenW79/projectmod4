'use strict';
const { Op } = require('sequelize');
let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // Specify schema in production
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    options.tableName = 'Images';
    await queryInterface.bulkInsert(
      options,
      [
        {
          userId: 1,
          spotId: 1,
          reviewId: null,
          url: 'https://example.com/image1.jpg',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 2,
          spotId: 2,
          reviewId: 1,
          url: 'https://example.com/image2.jpg',
          status: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 3,
          spotId: null,
          reviewId: 2,
          url: 'https://example.com/image3.jpg',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Images';
    await queryInterface.bulkDelete(options, {
      url: {
        [Op.in]: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      },
    });
  }
};
