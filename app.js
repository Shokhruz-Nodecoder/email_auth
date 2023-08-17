const express = require("express");
const nodemailer = require("nodemailer");
const Redis = require("ioredis");
const { connect } = require("mongoose");
const { generateHash, compareHash } = require("./bcrypt");
const userSchema = require("./user.model");

const app = express();
app.use(express.json());

const redis = new Redis({
  port: 6379,
  host: "127.0.0.1",

  password: "1234",
});

app.post("/singin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await userSchema.find({ email });
    if (findUser.length < 1) {
      return res
        .status(404)
        .json({ message: "Invalid email or password provided for login" });
    }
    const compare = await compareHash(password, findUser[0].password);

    if (!compare) {
      return res
        .status(404)
        .json({ message: "Invalid password provided to login" });
    }

    res.status(201).json({ message: "Login successful" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/singup", async (req, res) => {
  const { name, email, password } = req.body;

  // function getRandomCode() {
  //   return Math.floor(Math.random() * 9000) + 1000;
  // }
  // let verifyCode = getRandomCode();
  // console.log(verifyCode);

  redis.get("codes", async (err, data) => {
    if (data) {
      return res.send(JSON.parse(data));
    } else {
      const verifyCode = await function getRandomCode() {
        return Math.floor(Math.random() * 9000) + 1000;
      };

      await redis.set("codes", JSON.stringify(verifyCode()), "EX", 200);

      const transporter = nodemailer.createTransport({
        port: 465,
        host: "smtp.gmail.com",
        auth: {
          user: "nasirullayevo7@gmail.com",
          pass: "smenmggcgonbqmwl",
        },
        secure: true,
      });
      const mailData = {
        from: "nasirullayevo7@gmail.com",
        to: email,
        subject: "Verification code",
        text: `Verification code`,
        html: `<b>Login code:${verifyCode()}</b><br> Do not give this code to anyone<br/>`,
      };
      const generate = await generateHash(password);
      const findUser = await userSchema.find({ email: email });
      // console.log(findUser);
      if (!findUser.length < 1) {
        return res
          .status(404)
          .json({ message: "Invalid email or password provided for login" });
      }

      const user = await userSchema.create({
        name,
        email,
        password: generate,
      });

      if (findUser.length) {
        return res.status(404).json({ message: "Username already exists" });
      }
      await transporter.sendMail(mailData);
      res.status(200).json({
        message:
          "Successfully verifacation password sent. Please show your email code and You will send me...",
        id: user._id,
        data: user,
      });
    }
  });
});

app.post("/singup/verify/:id", async (req, res) => {
  const { id } = req.params;
  const { verification } = req.body;

  const findUser = await userSchema.findById(id);
  console.log(findUser);

  redis.get("codes", async (err, data) => {
    console.log(data)
    if (findUser && data == verification) {
      res.status(201).json({ message: "User is successfully registered" });
    } else {
      res.status(404).json({ message: "Not found or invalid password" });
    }
  });
});

const bootstrap = async (app) => {
  await connect("mongodb://127.0.0.1:27017/redis");
  app.listen(4000, () => {
    console.log(4000);
  });
};
bootstrap(app);
