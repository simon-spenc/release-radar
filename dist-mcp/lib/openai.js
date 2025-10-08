"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.warn('OPENAI_API_KEY not set');
}
exports.openai = apiKey ? new openai_1.default({ apiKey }) : null;
