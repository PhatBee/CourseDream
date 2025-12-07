import User from './auth.model.js'; // Import model đã sửa
import { hashPassword, comparePassword } from '../../utils/password.utils.js';
import { generateAccessToken, resetToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.utils.js';
import { generateOTP } from '../../utils/otp.utils.js';
import { sendEmail } from '../../utils/email.utils.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
};

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
        const { name, email, picture: avatar, email_verified, sub: googleId } = payload;

        // 2. Kiểm tra email đã được Google xác thực chưa
        if (!email_verified) {
            const err = new Error('Email Google chưa được xác thực.');
            err.status = 400;
            return next(err);
        }

        // 3. Tìm người dùng trong DB
        let user = await User.findOne({ email });

        if (user) {
            // 4a. Nếu user tồn tại, kiểm tra xem đã link chưa
            const isLinked = user.linkedAccounts && user.linkedAccounts.some(
                acc => acc.provider === 'google' && acc.providerId === googleId
            );

            if (!isLinked) {
                // Nếu chưa link, thêm vào linkedAccounts
                user.linkedAccounts.push({
                    provider: 'google',
                    providerId: googleId,
                    email: email
                });
                await user.save();
            }
        } else {
            // 4b. Nếu user không tồn tại, tạo user mới
            user = await User.create({
                name,
                email,
                avatar,
                authProvider: 'google', // Vẫn giữ để biết nguồn gốc ban đầu
                isVerified: true,
                role: 'student',
                linkedAccounts: [{
                    provider: 'google',
                    providerId: googleId,
                    email: email
                }]
            });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        setCookies(res, accessToken, refreshToken);

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
        };

        // 7. Trả về token và user (giống hệt hàm login)
        res.status(200).json({
            message: 'Đăng nhập Google thành công!',
            user: userResponse,
            accessToken,
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
        const { accessToken: fbAccessToken } = req.body;

        const fbGraphUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${fbAccessToken}`;
        const { data } = await axios.get(fbGraphUrl);

        const { email, name, picture, id: facebookId } = data;
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
            // 4a. Nếu user tồn tại, kiểm tra xem đã link chưa
            const isLinked = user.linkedAccounts && user.linkedAccounts.some(
                acc => acc.provider === 'facebook' && acc.providerId === facebookId
            );

            if (!isLinked) {
                user.linkedAccounts.push({
                    provider: 'facebook',
                    providerId: facebookId,
                    email: email
                });
                await user.save();
            }
        } else {
            // 4b. Nếu user không tồn tại, tạo user mới
            user = await User.create({
                name,
                email,
                avatar,
                authProvider: 'facebook',
                isVerified: true,
                role: 'student',
                linkedAccounts: [{
                    provider: 'facebook',
                    providerId: facebookId,
                    email: email
                }]
            });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        setCookies(res, accessToken, refreshToken);

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
        };

        // 7. Trả về token và user (giống hệt hàm login)
        res.status(200).json({
            message: 'Đăng nhập Facebook thành công!',
            user: userResponse,
            accessToken,
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
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

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

        if (!user.isActive) {
            const reason = user.banReason || "Vi phạm điều khoản.";
            return res.status(403).json({
                message: "Tài khoản của bạn đã bị vô hiệu hóa.",
                reason: reason
            });
        }

        // 3. So sánh mật khẩu
        if (!user.password) {
            const err = new Error('Tài khoản này chưa thiết lập mật khẩu. Vui lòng đăng nhập bằng Google/Facebook hoặc sử dụng chức năng Quên mật khẩu.');
            err.status = 400;
            return next(err);
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            const err = new Error('Email hoặc mật khẩu không đúng');
            err.status = 401; // 401 Unauthorized
            return next(err);
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        setCookies(res, accessToken, refreshToken);

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
        };

        // 6. Trả về token và thông tin người dùng
        res.status(200).json({
            message: 'Đăng nhập thành công!',
            user: userResponse,
            accessToken,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Làm mới Access Token
 * @route   POST /api/auth/refresh-token
 * @access  Public (Cookie)
 */
const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            const err = new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
            err.status = 401;
            return next(err);
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            const err = new Error('Refresh token không hợp lệ hoặc đã hết hạn.');
            err.status = 403;
            return next(err);
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            const err = new Error('Refresh token không hợp lệ.');
            err.status = 403;
            return next(err);
        }

        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        setCookies(res, newAccessToken, newRefreshToken);

        res.status(200).json({
            message: 'Refresh token thành công!',
            accessToken: newAccessToken,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đăng xuất
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const user = await User.findOne({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ message: 'Đăng xuất thành công!' });
    } catch (error) {
        next(error);
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

        // 2. YÊU CẦU: Cho phép tất cả tài khoản reset password để có thể login local
        // if (user.authProvider !== 'local') { ... } -> Bỏ chặn này

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

export { register, login, verifyOTP, googleLogin, facebookLogin, forgotPassword, verifyResetOTP, setPassword, refreshToken, logout };