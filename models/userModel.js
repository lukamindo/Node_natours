const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //🚨🚨🚨 COSTUME VALIDATOR ONLY WORKS ON CREATE and SAVE 🚨🚨🚨 და მარტო save უნდა ვიხმარო ყველგან
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwors are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//pre save middlewear
userSchema.pre('save', async function (next) {
  // tu password ar sheicvala mashin araferi ar moxdes
  if (!this.isModified('password')) return next();

  //shecvlis shemtxvevashi password gaishashos da chaiweros gahashhuli, confirmation kide waishalos ro text ar moxvdes DB-shi
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // tu ar shegvidzlia an pirvelad vqenit araferi ar moxdes
  if (!this.isModified('password') || this.isNew) return next();

  //sxva shemtxvevashi unda axali mnishvneloba mivcet

  //xandaxan ise xdeba ro save agvianebs tokenis dagenerirebas da token ufro adre iqmneba vidre password cvlileba amitom am dros
  //token gauqmebulad chaitvleba imito ro passwordChangedAt ufro meti iqneba amitom 1000(1wami) unda davaklot ro xelvnurad davwiot ukan
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// query middlewear aris faqtiurad anu sadac find vipovi maqamde gaatarebs da active tu ar aris ar momcems im momxmarebels
userSchema.pre(/^find/, function (next) {
  // jer yvelafers gaatarebs am filtrshi da shemdeg rasac controllershi vixmareb imashi
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestap) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestap < changedTimestamp;
  }
  return false;
};

//karoche davagenerirebt random strings da magas vgzavnit emailze, amaves gahashuls vinaxavt db-shi ro mere shevadarot iqidan gamogzavnils
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + +process.env.PASSWORDRESETEXPIRES;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
