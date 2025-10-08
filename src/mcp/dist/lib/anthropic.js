"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropic = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set');
}
exports.anthropic = apiKey ? new sdk_1.default({ apiKey }) : null;
