import * as authService from './auth.service.js';

/**
 * Helper: Set cookies cho access token và refresh token
 */
const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
};

/**
 * @desc    Đăng nhập/Đăng ký bằng Google
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;

        const { user, accessToken, refreshToken } = await authService.googleLogin(credential);

        setCookies(res, accessToken, refreshToken);

        res.status(200).json({
            message: 'Đăng nhập Google thành công!',
            user,
            accessToken,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đăng nhập/Đăng ký bằng Facebook
 * @route   POST /api/auth/facebook
 * @access  Public
 */
export const facebookLogin = async (req, res, next) => {
    try {
        const { accessToken: fbAccessToken } = req.body;

        const { user, accessToken, refreshToken } = await authService.facebookLogin(fbAccessToken);

        setCookies(res, accessToken, refreshToken);

        res.status(200).json({
            message: 'Đăng nhập Facebook thành công!',
            user,
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
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const result = await authService.register({ name, email, password });

        res.status(200).json({
            message: 'Mã OTP đã được gửi. Vui lòng kiểm tra email.',
            email: result.email,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bước 2: Xác thực OTP và Kích hoạt tài khoản
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const result = await authService.verifyOTP({ email, otp });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { user, accessToken, refreshToken } = await authService.login({ email, password });

        setCookies(res, accessToken, refreshToken);

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            user,
            accessToken,
        });
    } catch (error) {
        // Xử lý đặc biệt cho trường hợp tài khoản bị ban
        if (error.statusCode === 403 && error.reason) {
            return res.status(403).json({
                message: error.message,
                reason: error.reason
            });
        }
        next(error);
    }
};

/**
 * @desc    Làm mới Access Token
 * @route   POST /api/auth/refresh-token
 * @access  Public (Cookie)
 */
export const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await authService.refreshTokenService(refreshToken);

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
export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        const result = await authService.logout(refreshToken);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bước 1: Quên mật khẩu (Gửi OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const result = await authService.forgotPassword({ email });

        res.status(200).json({
            message: 'Mã OTP đã được gửi. Vui lòng kiểm tra email.',
            email: result.email,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bước 2: Xác thực OTP (Cấp token reset)
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
export const verifyResetOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const result = await authService.verifyResetOTP({ email, otp });

        res.status(200).json({
            message: 'Xác thực OTP thành công!',
            resetToken: result.resetToken,
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
export const setPassword = async (req, res, next) => {
    try {
        const { resetToken, password } = req.body;

        const result = await authService.setPassword({ resetToken, password });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};