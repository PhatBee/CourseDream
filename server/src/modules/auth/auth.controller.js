import User from './auth.model.js'; // Import model đã sửa
import { hashPassword, comparePassword } from '../../utils/password.utils.js';
import { generateToken } from '../../utils/jwt.utils.js';
import { generateOTP } from '../../utils/otp.utils.js';
import { sendEmail } from '../../utils/email.utils.js';

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

export { register, login, verifyOTP };