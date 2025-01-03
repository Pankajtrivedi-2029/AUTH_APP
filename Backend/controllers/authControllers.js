import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js'
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register = async(req,res) => {
    const {name,email,password} = req.body;

    if(!name || !email || !password){
        return res.json({success:false,message:"All input fields are required"})
    }

    try {

        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.json({success:false , message:"Email already exists"});
        } 

        const existingName = await userModel.findOne({name});
        if(existingName){
            return res.json({success:false,message:"Username already exists"});
        }


        // const hashedPassword = await bcrypt.hash(password,10);
         // Generate a salt with 10 rounds
         const salt = await bcrypt.genSalt(10);
         // Hash the password using the generated salt
         const hashedPassword = await bcrypt.hash(password, salt);

        const user = new userModel(
            {
            name,email,password:hashedPassword
        }
    )

    await user.save();

    const token = jwt.sign(
        {id:user._id},
        process.env.JWT_SECRET_KEY,
        {expiresIn:'1d'}
    )

    res.cookie('token',token,{
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge : 7*24*60*60*1000

    })

    const mailOption = {
        from : process.env.SENDER_MAIL,
        to:email,
        subject: `Welcome ${name} to AUTH_APP`,
        text : `Welcome to AUTH_APP. Your account has been created successfully with the email id: ${email}`
    }

    await transporter.sendMail(mailOption);
    
    return res.json({success:true , message: "User registered successfully"})
   
} catch (error) {
        return res.json({success:false , message : error.message})
    }
}

export const login = async(req,res) => {
    const {email,password} = req.body;

    if( !email || !password){
        return res.json({success:false,message:"All input fields are required"})
    }

    try {

        const User = await userModel.findOne({email});
        if(!User){
            return res.json({success:false , message:"Invalid email"});
        } 

        const isMatchingPassword = await bcrypt.compare(password,User.password);

        if(!isMatchingPassword){
            return res.json({success:false,message:"Invalid password"});
        }

        const token = jwt.sign(
            {id:User._id},
            process.env.JWT_SECRET_KEY,
            {expiresIn:'1d'}
        )

    res.cookie('token',token,{
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge : 7*24*60*60*1000

    })
        
    return res.json({success:true , message: "User Logged-in successfully"})
    } catch (error) {
        return res.json({success:false , message : error.message})
    }
}

export const logout = async(req,res) => {
    try {
        res.clearCookie('token',{
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })

        return res.json({success:true,message:"User logged out successfully"})
    } catch (error) {
        return res.json({success:false,message:error.message})

    }
}

// // send verificaton otp to the user's mail
// export const sendVerifyOtp = async (req,res) => {
//     try {
//         const {userId,name} = req.body;
//         const user = await userModel.findById(userId);

//         if(user.isAccountVerified){
//             return res.json({success:false , message:"Account already verified"})
//         }

//         const otp = String(Math.floor(Math.random()*900000 + 100000));

//         user.verifyOtp = otp;

//         user.verifyOtpExpireAt = Date.now() + 24*60*60*1000

//         await user.save();

//         const mailOption = {
//         from : process.env.SENDER_EMAIL,
//         to:user.email,
//         subject: `Welcome ${name} to AUTH_APP`,
//         text : `Your OTP is ${otp} , verify your account using this OTP.`
//         }

//     await transporter.sendMail(mailOption);
//     res.json({success:true,message:"Verification otp has sent on the Email."});

//     } catch (error) {
//         res.json({success:false,message:error.message});
//     }
// }

// send verification OTP to the user's mail
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId, name } = req.body;
        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" });
        }

        const otp = String(Math.floor(Math.random() * 900000 + 100000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_MAIL,
            to: user.email,
            subject: `Account Verification`,
            // text: `Your OTP is ${otp}, verify your account using this OTP.`,
            html : EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        };

        await transporter.sendMail(mailOption);
        return res.json({ success: true, message: "Verification OTP has been sent to the email." });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Email verification
export const verifyEmail = async (req,res) =>{
   const {userId,otp} = req.body;
   
   if(!userId || !otp){
       return res.json({success:false,message:'Missing Details'});
   }

   try {
      const user = await userModel.findById(userId);

      if(!user){
        return res.json({success:false,message:'User not found'});
      }

      if(user.verifyOtp ==='' || user.verifyOtp !== otp){
        return res.json({success:false,message:'Invalid OTP'});
      }

      if(user.verifyOtpExpireAt < Date.now()){
        return res.json({success:false,message:'OTP Expired'});
      }

      user.isAccountVerified = true;
      user.verifyOtp = '';
      user.verifyOtpExpireAt = 0;

      await user.save();
      return res.json({success:true , message:'Email is verified successfully'})

   } catch (error) {
      return res.json({success:false , message:error.message})
   }
};

// check if user is authenticated or not
export const isAuthenticated = async(req,res) => {
    try {
        return res.json({success:true});
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

// send password reset otp
export const sendResetOtp = async(req,res) => {
    const {email} = req.body;

    if(!email){
        return res.json({success:false,message:"Email is required."})
    }

    try {
        const user = await userModel.findOne({email});

        if(!user){
            return res.json({success : false , message:"User not found."});
        }

        const otp = String(Math.floor(Math.random() * 900000 + 100000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_MAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            // text: `Your OTP is ${otp}, reset your password using this OTP.`,
            html : PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        };

        await transporter.sendMail(mailOption);

        return res.json({success:true,message:'OTP send to your email.'})

    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

// Reset user password
export const resetPassword = async(req,res) => {
    const {email,otp,newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({success:false,message:'All input fields are required.'})
    }

    try {
        const user = await userModel.findOne({email});
        if(!user){
         return res.json({success:false,message:'User not found.'})
        }

        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({success:false,message:'Invalid OTP'})
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success:false,message:'OTP expired.'})
        }

        const hashedPassword = await bcrypt.hash(newPassword,10);

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;


        await user.save();

        return res.json({success:true,message:'Password has been reset successfully.'})


    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}