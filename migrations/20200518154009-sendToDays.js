module.exports = {
  up: async function (db, client) {
    const venues = await db.collection('venues').find({}).toArray();

    venues.map(async venue => {
      let days = venue.shippingMaxDays || 5;
      let values = venue.sendTo.map(v => {
        return {venue: v, shippingMaxDays: days};
      });

      await db.collection('venues').updateOne(
        { _id: venue._id},
        { $set: {'sendToDays': values }});
    });
  },

  async down(db, client) {
    await db.collection('venues').updateMany({}, {$unset: {sendToDays: 1}}, false, true);
  }
};
