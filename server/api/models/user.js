import _ from 'lodash';
import mongoose from 'mongoose';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import findOrCreate from 'mongoose-findorcreate';
import uniqueValidator from 'mongoose-unique-validator';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
    },
    firstConnection: {
        type: Boolean,
        required: false,
        default: true
    },
    points: {
        type: Number,
        default: 0,
        required: false,
    },
    facebookId: {
        type: String,
        required: false,
        default: null
    },
    googleId: {
        type: String,
        required: false,
        default: null
    },
    tokens: [
        {
            access: {
                type: String,
                required: true
            },
            token: {
                type: String,
                required: true
            }
        }
    ]
});

// Plugins
UserSchema.plugin(findOrCreate);
UserSchema.plugin(uniqueValidator);

// Methods
UserSchema.methods.toJSON = function () {
    let user = this.toObject();
    return _.pick(user, ['_id', 'email', 'firstName', 'lastName', 'firstConnection', 'points']);
}

UserSchema.methods.generateAuthToken = async function () {
    let user = this;
    let access = 'auth';
    let token = jwt.sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET).toString();

    user.tokens = user.tokens.concat([{ access, token }]);
    await user.save();
    return token;
};

UserSchema.methods.removeToken = function (token) {
    let user = this;
    return user.update({
        $pull: {
            tokens: { token }
        }
    });
};

// Static methods
UserSchema.statics.findByToken = function (token) {
    let user = this;
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return Promise.reject();
    }

    return User.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

UserSchema.statics.findByCredentials = function (email, password) {
    let user = this;
    return User.findOne({ email }).then(user => {
        if (!user) {
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    }).catch(e => {
        return Promise.reject();
    });
};

// Events
UserSchema.pre('save', function (next) {
    let user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

export const User = mongoose.model('User', UserSchema);