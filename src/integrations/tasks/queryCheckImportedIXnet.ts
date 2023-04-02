// http://localhost:3030/settings/cars/6345b6a471e44d00156277b6
[
  {
    $match: {
      importedType: "ixnet",
    },
  },
  {
    $group: {
      _id: {
        from: "$importedFrom",
        venue: "$venue",
        form: "$form",
      },
      cars: {
        $addToSet: "$car",
      },
      forms: {
        $addToSet: "$form",
      },
      count: {
        $sum: 1,
      },
    },
  },
  {
    $project: {
      from: {
        $toString: "$_id.from",
      },
      venue: "$_id.venue",
      form: "$_id.form",
      cars: {
        $size: "$cars",
      },
      forms: 1,
      count: 1,
    },
  },
  {
    $lookup: {
      from: "venues",
      localField: "venue",
      foreignField: "_id",
      as: "venue",
    },
  },
  {
    $unwind: {
      path: "$venue",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "forms",
      localField: "form",
      foreignField: "_id",
      as: "form",
    },
  },
  {
    $unwind: {
      path: "$form",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      from: 1,
      venue: "$venue.name",
      form: "$form.name",
      cars: 1,
      count: 1,
    },
  },
]
