const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const { generateOTP } = require("../services/otp");
const { sendmail } = require("../services/mailConfg");
const JWT = require("jsonwebtoken");
const JWT_KEY = process.env.JWT_KEY;

//register
const registerUser = async (req, res) => {
  try {
    const { email, name, password, confirmpassword } = req.body;
    const isExisting = await User.findOne({ email });
    if (isExisting) return res.status(400).send("Email already registered");

    if ((!email, !name, !password, !confirmpassword))
      return res.status(400).send("Fill all Fields");

    if (password !== confirmpassword)
      return res.status(400).send("Password and Confirm Password dosent match");

    // password hashing
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password, salt);

    // otp
    const otpGenerated = generateOTP();

    const data = await User.create({
      email,
      name,
      password: hashpassword,
      otp: otpGenerated,
    });
    if (!data) return res.status(400).send("unable to create");

    // mail sending
    const mail = await sendmail({
      to: email,
      OTP: otpGenerated,
    });
    if (!mail) return res.status(400).send("OTP didnt send");

    return res
      .status(200)
      .json({ message: "OTP has been sended to your mail ", mail: email });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred: " + error.message });
  }
};

const verifyUserWithOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("User not Found");

    if (user && user.otp !== otp) return res.status(400).send("Invalid OTP");

    const updateUser = await User.findByIdAndUpdate(user._id, {
      $set: { active: true },
    });
    const userUpdated = await User.findOne({ email });

    return res.status(200).send("Account Created Successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred: " + error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    //Checking all feilds are available
    if (!email || !password) return res.status(400).send("Fill al the feilds");
    //checking is email is registered or not
    const data = await User.findOne({ email, active: true });
    if (!data) return res.status(400).send("User not Found");
    //comparing passwords
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) return res.status(400).send("Invalid Credentials");
    //generate JWT
    const token = JWT.sign({ email: data.email }, JWT_KEY, {
      expiresIn: "2hr",
    });
    if (!token) return res.status(200).send("Token not generated");

    res
      .cookie("token", token, { httpOnly: true, secure: true })
      .status(200)
      .json({
        message: "login Successfull",
        email: data.email,
        name: data.name,
      });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  registerUser,
  verifyUserWithOTP,
  loginUser,
};
