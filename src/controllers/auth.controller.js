const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service")

async function userRegisterController(req, res) {
  try {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({ email });

    if (isExists) {
      return res.status(422).json({
        message: "user already exist with email",
        status: "failed",
      });
    }

    const user = await userModel.create({
      email,
      password,
      name,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("jwt_token", token, {
      httpOnly: true,
    });

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    })

    await emailService.sendRegistrationEmail(user.email, user.name)
  } catch (error) {
    res.status(500).json({
      message: error.message + " yes",
    });
  }
}

async function userLoginController(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({email}).select("+password")

    if(!user) {
        return res.status(401).json({
            message : "user not found"
        })
    }

    const isvalidPassword = await user.comparePassword(password)

    if(!isvalidPassword) {
        return res.status(401).json({
          message: "user not found"
        });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("jwt_token", token, {
      httpOnly: true,
    });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });

}

module.exports = { userRegisterController, userLoginController };
