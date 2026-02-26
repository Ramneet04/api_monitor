import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import SecurityUtils from "../utils/SecurityUtils.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        validate: {
            validator: function (userName) {
                return /^[a-zA-Z0-9_.-]+$/.test(userName);
            },
            message: "Please enter a valid username"
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: "Please enter a valid email"
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        validate: {
            validator: function (password) {
                if (this.isModified('password') && password && !password.startsWith('$2a$')) {
                    const validation = SecurityUtils.validatePassword(password)
                    return validation.success
                };
                return true
            },
            message: function (props) {
                if (props.value && !props.value.startsWith('$2a$')) {
                    const validation = SecurityUtils.validatePassword(props.value)
                    return validation.errors.join(". ");
                };
                return "Password validation failed"
            }
        },

    }

})