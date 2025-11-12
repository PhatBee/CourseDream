import User from './auth.model.js'; // Import model đã sửa
import { hashPassword, comparePassword } from '../../utils/password.utils.js';
import { generateToken, resetToken } from '../../utils/jwt.utils.js';
import { generateOTP } from '../../utils/otp.utils.js';
import { sendEmail } from '../../utils/email.utils.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Đăng nhập/Đăng ký bằng Google
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body; // 'credential' là id_token từ frontend

    // 1. Xác thực id_token với Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { name, email, picture: avatar, email_verified } = payload;

    // 2. Kiểm tra email đã được Google xác thực chưa
    if (!email_verified) {
      const err = new Error('Email Google chưa được xác thực.');
      err.status = 400;
      return next(err);
    }

    // 3. Tìm người dùng trong DB
    let user = await User.findOne({ email });

    if (user) {
      // 4a. Nếu user tồn tại, kiểm tra phương thức đăng nhập
      if (user.authProvider === 'local') {
        const err = new Error('Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.');
        err.status = 400;
        return next(err);
      }
      // Nếu user.authProvider === 'google', thì đây là đăng nhập -> tiếp tục
    } else {
      // 4b. Nếu user không tồn tại, tạo user mới
      user = await User.create({
        name,
        email,
        avatar,
        authProvider: 'google', // Đặt phương thức là google
        isVerified: true,       // Email đã được Google xác thực
        role: 'student',        // Vai trò mặc định
        // Mật khẩu không cần thiết (model đã xử lý)
      });
    }

    // 5. Tạo JWT của hệ thống
    const token = generateToken(user._id, user.role);

    // 6. Lọc thông tin trả về
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    // 7. Trả về token và user (giống hệt hàm login)
    res.status(200).json({
      message: 'Đăng nhập Google thành công!',
      token,
      user: userResponse,
    });
  } catch (error) {
    // Nếu token không hợp lệ, nó sẽ ném ra lỗi
    next(error);
  }
};

/**
 * @desc    Đăng nhập/Đăng ký bằng Facebook
 * @route   POST /api/auth/facebook
 * @access  Public
 */
const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    // 1. Xác thực accessToken với Facebook và lấy thông tin user
    // Chúng ta cần lấy 'id, name, email, picture'
    const fbGraphUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;
    
    const { data } = await axios.get(fbGraphUrl);
    
    const { email, name, picture } = data;
    const avatar = picture.data.url;

    // 2. Kiểm tra xem có email không (rất quan trọng)
    if (!email) {
      const err = new Error('Không thể lấy email từ tài khoản Facebook. Vui lòng thử cách khác.');
      err.status = 400;
      return next(err);
    }

    // 3. Tìm người dùng trong DB
    let user = await User.findOne({ email });

    if (user) {
      // 4a. Nếu user tồn tại, kiểm tra phương thức đăng nhập
      if (user.authProvider === 'local') {
        const err = new Error('Email này đã được đăng ký bằng mật khẩu.');
        err.status = 400;
        return next(err);
      }
      if (user.authProvider === 'google') {
        const err = new Error('Email này đã được đăng ký bằng Google.');
        err.status = 400;
        return next(err);
      }
      // Nếu user.authProvider === 'facebook', thì đây là đăng nhập -> tiếp tục
    } else {
      // 4b. Nếu user không tồn tại, tạo user mới
      user = await User.create({
        name,
        email,
        avatar,
        authProvider: 'facebook', // Đặt phương thức là facebook
        isVerified: true,       // Email đã được Facebook xác thực
        role: 'student',        // Vai trò mặc định
      });
    }

    // 5. Tạo JWT của hệ thống
    const token = generateToken(user._id, user.role);

    // 6. Lọc thông tin trả về
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    // 7. Trả về token và user (giống hệt hàm login)
    res.status(200).json({
      message: 'Đăng nhập Facebook thành công!',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Lỗi Facebook Login:", error.response?.data || error.message);
    const err = new Error('Xác thực Facebook thất bại.');
    err.status = 401;
    next(err);
  }
};

/**
 * @desc    Bước 1: Bắt đầu đăng ký (Gửi OTP)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Kiểm tra xem email đã được KÍCH HOẠT chưa
    const existingVerifiedUser = await User.findOne({ email, isVerified: true });
    if (existingVerifiedUser) {
      const err = new Error('Email đã tồn tại');
      err.status = 400;
      return next(err);
    }

    // 2. Băm mật khẩu
    const hashedPassword = await hashPassword(password);

    // 3. Tạo OTP và thời gian hết hạn (15 phút)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // 4. Tìm và cập nhật user chưa xác thực HOẶC tạo mới
    // (Giúp user có thể nhấn "đăng ký" lại nếu lỡ mất OTP)
    const user = await User.findOneAndUpdate(
      { email, isVerified: false }, // Tìm user chưa xác thực có email này
      { 
        name,
        password: hashedPassword,
        otp,
        otpExpires,
        role: 'student', // Đảm bảo vai trò là student
        isVerified: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // upsert: true = tạo nếu không tìm thấy
    );

    // 5. Gửi email chứa OTP
    try {
      await sendEmail({
        to: user.email,
        subject: 'Mã xác thực đăng ký DreamsLMS',
        html: `<p>Chào ${user.name},</p>
               <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
               <p>Mã này sẽ hết hạn sau 15 phút.</p>`,
      });

      // 6. Trả về thông báo thành công
      res.status(200).json({
        message: 'Mã OTP đã được gửi. Vui lòng kiểm tra email.',
        email: user.email, // Trả về email để frontend biết
      });
    } catch (emailError) {
      // Nếu gửi email lỗi (ví dụ: email không tồn tại)
      console.error("Lỗi gửi email:", emailError);
      const err = new Error('Không thể gửi email. Vui lòng thử lại.');
      err.status = 500;
      return next(err);
    }

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bước 2: Xác thực OTP và Kích hoạt tài khoản
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Tìm user bằng email
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Email không tồn tại.');
      err.status = 400;
      return next(err);
    }
    
    // 2. Kiểm tra trạng thái/OTP
    if (user.isVerified) {
      const err = new Error('Tài khoản này đã được kích hoạt.');
      err.status = 400;
      return next(err);
    }

    if (user.otp !== otp) {
      const err = new Error('Mã OTP không đúng.');
      err.status = 400;
      return next(err);
    }

    // TTL index sẽ lo việc hết hạn, nhưng chúng ta vẫn nên kiểm tra
    if (user.otpExpires < Date.now()) {
      const err = new Error('Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
      err.status = 400;
      return next(err);
    }

    // 3. Kích hoạt tài khoản
    user.isVerified = true;
    user.otp = null; // Xóa OTP sau khi dùng
    user.otpExpires = null; // Xóa thời gian hết hạn
    await user.save();

    // 4. Trả về thông báo
    res.status(200).json({
      message: 'Xác thực thành công! Vui lòng đăng nhập.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm người dùng bằng email
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Email hoặc mật khẩu không đúng');
      err.status = 401; // 401 Unauthorized
      return next(err);
    }

    // 2. Kiểm tra tài khoản đã kích hoạt chưa
    if (!user.isVerified) {
       const err = new Error('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email hoặc đăng ký lại.');
       err.status = 401;
       return next(err);
    }

    // 3. So sánh mật khẩu
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const err = new Error('Email hoặc mật khẩu không đúng');
      err.status = 401; // 401 Unauthorized
      return next(err);
    }

    // 4. Tạo Token
    const token = generateToken(user._id, user.role);

    // 5. Lọc thông tin trả về (loại bỏ mật khẩu)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    // 6. Trả về token và thông tin người dùng
    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error); // Chuyển lỗi đến global error handler
  }
};

/**
 * @desc    Bước 1: Quên mật khẩu (Gửi OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1. Tìm user
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Email không tồn tại.');
      err.status = 404;
      return next(err);
    }

    // 2. YÊU CẦU: Chỉ cho tài khoản 'local'
    if (user.authProvider !== 'local') {
      const err = new Error(`Tài khoản này được đăng ký qua ${user.authProvider}. Không thể đặt lại mật khẩu.`);
      err.status = 400;
      return next(err);
    }

    // 3. Tạo OTP và thời gian hết hạn (10 phút)
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    // 4. Gửi email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Mã khôi phục mật khẩu DreamsCourse',
        html: `<p>Chào ${user.name},</p>
               <p>Mã OTP khôi phục mật khẩu của bạn là: <strong>${otp}</strong></p>
               <p>Mã này sẽ hết hạn sau 10 phút.</p>`,
      });

      // 5. Trả về thông báo thành công
      res.status(200).json({
        message: 'Mã OTP đã được gửi. Vui lòng kiểm tra email.',
        email: user.email, // Trả về email để frontend dùng
      });
    } catch (emailError) {
      console.error("Lỗi gửi email:", emailError);
      const err = new Error('Không thể gửi email. Vui lòng thử lại.');
      err.status = 500;
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bước 2: Xác thực OTP (Cấp token reset)
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Tìm user bằng email, OTP và thời gian
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
      err.status = 400;
      return next(err);
    }

    // 2. Xóa OTP sau khi xác thực
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 3. Tạo một token reset ngắn hạn (10 phút)
    // Token này chứng minh user đã vượt qua bước OTP
    const resetToken2 = await resetToken(user._id);

    // 4. Trả về token
    res.status(200).json({
      message: 'Xác thực OTP thành công!',
      resetToken: resetToken2,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bước 3: Đặt mật khẩu mới
 * @route   POST /api/auth/set-password
 * @access  Public (nhưng cần token)
 */
const setPassword = async (req, res, next) => {
  try {
    const { resetToken, password } = req.body;

    // 1. Xác thực token reset
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      const err = new Error('Token không hợp lệ hoặc đã hết hạn.');
      err.status = 401;
      return next(err);
    }

    // 2. Tìm user từ ID trong token
    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error('Không tìm thấy người dùng.');
      err.status = 404;
      return next(err);
    }

    // 3. Băm và cập nhật mật khẩu mới
    user.password = await hashPassword(password);
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    next(error);
  }
};

export { register, login, verifyOTP, googleLogin, facebookLogin, forgotPassword, verifyResetOTP, setPassword };