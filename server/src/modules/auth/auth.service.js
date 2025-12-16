import User from './auth.model.js';
import { hashPassword, comparePassword } from '../../utils/password.utils.js';
import { generateAccessToken, resetToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.utils.js';
import { generateOTP } from '../../utils/otp.utils.js';
import { sendEmail } from '../../utils/email.utils.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Service: Đăng nhập/Đăng ký bằng Google
 */
export const googleLogin = async (credential) => {
    // 1. Xác thực id_token với Google
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture: avatar, email_verified, sub: googleId } = payload;

    // 2. Kiểm tra email đã được Google xác thực chưa
    if (!email_verified) {
        const error = new Error('Email Google chưa được xác thực.');
        error.statusCode = 400;
        throw error;
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
            authProvider: 'google',
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

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };

    return { user: userResponse, accessToken, refreshToken };
};

/**
 * Service: Đăng nhập/Đăng ký bằng Facebook
 */
export const facebookLogin = async (fbAccessToken) => {
    const fbGraphUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${fbAccessToken}`;
    const { data } = await axios.get(fbGraphUrl);

    const { email, name, picture, id: facebookId } = data;
    const avatar = picture.data.url;

    // 2. Kiểm tra xem có email không (rất quan trọng)
    if (!email) {
        const error = new Error('Không thể lấy email từ tài khoản Facebook. Vui lòng thử cách khác.');
        error.statusCode = 400;
        throw error;
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

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };

    return { user: userResponse, accessToken, refreshToken };
};

/**
 * Service: Bước 1 - Đăng ký (Gửi OTP)
 */
export const register = async ({ name, email, password }) => {
    // 1. Kiểm tra xem email đã được KÍCH HOẠT chưa
    const existingVerifiedUser = await User.findOne({ email, isVerified: true });
    if (existingVerifiedUser) {
        const error = new Error('Email đã tồn tại');
        error.statusCode = 400;
        throw error;
    }

    // 2. Băm mật khẩu
    const hashedPassword = await hashPassword(password);

    // 3. Tạo OTP và thời gian hết hạn (15 phút)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    // 4. Tìm và cập nhật user chưa xác thực HOẶC tạo mới
    const user = await User.findOneAndUpdate(
        { email, isVerified: false },
        {
            name,
            password: hashedPassword,
            otp,
            otpExpires,
            role: 'student',
            isVerified: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
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

        return { email: user.email };
    } catch (emailError) {
        console.error("Lỗi gửi email:", emailError);
        const error = new Error('Không thể gửi email. Vui lòng thử lại.');
        error.statusCode = 500;
        throw error;
    }
};

/**
 * Service: Bước 2 - Xác thực OTP và Kích hoạt tài khoản
 */
export const verifyOTP = async ({ email, otp }) => {
    // 1. Tìm user bằng email
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Email không tồn tại.');
        error.statusCode = 400;
        throw error;
    }

    // 2. Kiểm tra trạng thái/OTP
    if (user.isVerified) {
        const error = new Error('Tài khoản này đã được kích hoạt.');
        error.statusCode = 400;
        throw error;
    }

    if (user.otp !== otp) {
        const error = new Error('Mã OTP không đúng.');
        error.statusCode = 400;
        throw error;
    }

    if (user.otpExpires < Date.now()) {
        const error = new Error('Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
        error.statusCode = 400;
        throw error;
    }

    // 3. Kích hoạt tài khoản
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return { message: 'Xác thực thành công! Vui lòng đăng nhập.' };
};

/**
 * Service: Đăng nhập người dùng
 */
export const login = async ({ email, password }) => {
    // 1. Tìm người dùng bằng email
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        throw error;
    }

    // 2. Kiểm tra tài khoản đã kích hoạt chưa
    if (!user.isVerified) {
        const error = new Error('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email hoặc đăng ký lại.');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const reason = user.banReason || "Vi phạm điều khoản.";
        const error = new Error("Tài khoản của bạn đã bị vô hiệu hóa.");
        error.statusCode = 403;
        error.reason = reason;
        throw error;
    }

    // 3. So sánh mật khẩu
    if (!user.password) {
        const error = new Error('Tài khoản này chưa thiết lập mật khẩu. Vui lòng đăng nhập bằng Google/Facebook hoặc sử dụng chức năng Quên mật khẩu.');
        error.statusCode = 400;
        throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };

    return { user: userResponse, accessToken, refreshToken };
};

/**
 * Service: Làm mới Access Token
 */
export const refreshTokenService = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
        error.statusCode = 401;
        throw error;
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        const err = new Error('Refresh token không hợp lệ hoặc đã hết hạn.');
        err.statusCode = 403;
        throw err;
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
        const error = new Error('Refresh token không hợp lệ.');
        error.statusCode = 403;
        throw error;
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Service: Đăng xuất
 */
export const logout = async (refreshToken) => {
    if (refreshToken) {
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
    }
    return { message: 'Đăng xuất thành công!' };
};

/**
 * Service: Bước 1 - Quên mật khẩu (Gửi OTP)
 */
export const forgotPassword = async ({ email }) => {
    // 1. Tìm user
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Email không tồn tại.');
        error.statusCode = 404;
        throw error;
    }

    // 2. Tạo OTP và thời gian hết hạn (10 phút)
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // 3. Gửi email
    try {
        await sendEmail({
            to: user.email,
            subject: 'Mã khôi phục mật khẩu DreamsCourse',
            html: `<p>Chào ${user.name},</p>
             <p>Mã OTP khôi phục mật khẩu của bạn là: <strong>${otp}</strong></p>
             <p>Mã này sẽ hết hạn sau 10 phút.</p>`,
        });

        return { email: user.email };
    } catch (emailError) {
        console.error("Lỗi gửi email:", emailError);
        const error = new Error('Không thể gửi email. Vui lòng thử lại.');
        error.statusCode = 500;
        throw error;
    }
};

/**
 * Service: Bước 2 - Xác thực OTP (Cấp token reset)
 */
export const verifyResetOTP = async ({ email, otp }) => {
    // 1. Tìm user bằng email, OTP và thời gian
    const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() },
    });

    if (!user) {
        const error = new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
        error.statusCode = 400;
        throw error;
    }

    // 2. Xóa OTP sau khi xác thực
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 3. Tạo một token reset ngắn hạn (10 phút)
    const resetToken2 = await resetToken(user._id);

    return { resetToken: resetToken2 };
};

/**
 * Service: Bước 3 - Đặt mật khẩu mới
 */
export const setPassword = async ({ resetToken, password }) => {
    // 1. Xác thực token reset
    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (jwtError) {
        const error = new Error('Token không hợp lệ hoặc đã hết hạn.');
        error.statusCode = 401;
        throw error;
    }

    // 2. Tìm user từ ID trong token
    const user = await User.findById(decoded.id);
    if (!user) {
        const error = new Error('Không tìm thấy người dùng.');
        error.statusCode = 404;
        throw error;
    }

    // 3. Băm và cập nhật mật khẩu mới
    user.password = await hashPassword(password);
    await user.save();

    return { message: 'Đặt lại mật khẩu thành công!' };
};
