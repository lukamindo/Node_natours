const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //THis only works on create not on update. საუბარია this keyword-ზე
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        emun: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          emun: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate
//ეს არის საშოალება რო მშობელმა იცოდეს თავისი შვილების შესახებ მაგრამ populate მაინც უნდა ცალკე
tourSchema.virtual('reviews', {
  ref: 'Review',
  // თვითონ ამ მოდელის შესაბამისის ფილდის სახელი იმ რეფერენს მოდელში ამ შემთხვევაში tourModel გვაქვს და reviewModel-ში field-ს ქვია tour
  foreignField: 'tour',
  // ანუ აქ სადაა შენახული ID
  localField: '_id',

  // ანუ აქ _id რაც არის იმ მეორე მოდელში ქვია tour. ბაზაში როგორც ინახება ეგაა რაა
});

//DOCUMENT MIDDLEWEAR triggers on  .save() and .create().  NOT ON   .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// we are mapping over guide array in which client wrote ids of guides,  and saving promises of users's data in guidePromises array
// next we want to execute all promises at the same time, therefore we use Promise.all and after that we save that data in guide field in DB
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// Query MIDDLEWEAR  ანუ კომენტარში რაც მაქვს დაათრიგერებდა მარტო ფაინდს და ეს რეგექსი ათრიგერებს ყველას რაც ფაინდით იწყება და ესენია findbyId....
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    // field wich we want to "replace"
    path: 'guides',
    // fields we dont want to select from DB
    select: '-__v -passwordChangedAt',
  });
  next();
});

//AGGREGATION MIDDLEWEAR
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
