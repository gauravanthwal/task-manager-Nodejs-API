const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require('./tasks.js');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid ");
      }
    },
  },
  password: {
    type: String,
    minlength: 7,
    required: true,
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error("age must be a positive Number!");
      }
    },
  },
  tokens: [{
      token: {
        type: String,
        required: true,
      },
    }],
    avatar: {
      type: Buffer
    }
},{
  timestamps: true
})

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

/************************** Generate Auth Tokens ************************************/
userSchema.methods.generateAuthToken = async function () {
  // const user = this;
  const token = jwt.sign(
    { _id: this._id.toString() },
    "thisisalongstringformytoken"
  );

  this.tokens = this.tokens.concat({ token });
  await this.save();

  return token;
};
/******************************************************************************** */

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new Error("unable to login!- user is not found");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("unable to login!");
  }
  return user;
};

/********************************* HASHING PASSWORD ***************************** */
userSchema.pre("save", async function (next) {
  const user = this;
  
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('remove', async function(next){
  await Task.deleteMany({ owner: this._id})
  next()
}) 

const User = mongoose.model("User", userSchema);

module.exports = User;
