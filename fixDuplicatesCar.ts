duplicates = db.cars.aggregate([
  {$match: {team: ObjectId("5bf2de34caf8ef7096105cda")}},
  {$group: {_id: {vin: "$vin"}, count: {$sum: 1}}},
  {$match: {count: {$ne: 1}}
}]).toArray();
