import User from './auth.model.js'; // Import model đã sửa
import { hashPassword, comparePassword } from '../../utils/password.utils.js';
import { generateToken } from '../../utils/jwt.utils.js';

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    // Chỉ lấy name, email, password từ body.
    // Chúng ta KHÔNG lấy 'role' để tránh user tự ý gán vai trò.
    const { name, email, password } = req.body;

    // 1. Kiểm tra xem email đã tồn tại chưa
    // (Validation cơ bản đã được middleware xử lý)
    const userExists = await User.findOne({ email });
    if (userExists) {
      const err = new Error('Email đã tồn tại');
      err.status = 400; 
      return next(err);
    }

    // 2. Băm mật khẩu
    const hashedPassword = await hashPassword(password);

    // 3. Tạo người dùng mới, GÁN VAI TRÒ "student" CỨNG
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student', // <-- Gán cứng vai trò là 'student'
    });

    // 4. Trả về thông tin cơ bản
    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng đăng nhập.', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error); // Chuyển lỗi đến global error handler
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

    // 2. So sánh mật khẩu
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const err = new Error('Email hoặc mật khẩu không đúng');
      err.status = 401; // 401 Unauthorized
      return next(err);
    }

    // 3. Tạo Token
    const token = generateToken(user._id, user.role);

    // 4. Lọc thông tin trả về (loại bỏ mật khẩu)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    // 5. Trả về token và thông tin người dùng
    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error); // Chuyển lỗi đến global error handler
  }
};

export { register, login };