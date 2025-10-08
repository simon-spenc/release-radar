"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCS_REPO_NAME = exports.DOCS_REPO_OWNER = exports.octokit = void 0;
const rest_1 = require("@octokit/rest");
const token = process.env.GITHUB_TOKEN;
if (!token) {
    console.warn('GITHUB_TOKEN not set');
}
exports.octokit = token ? new rest_1.Octokit({ auth: token }) : null;
exports.DOCS_REPO_OWNER = process.env.DOCS_REPO_OWNER || '';
exports.DOCS_REPO_NAME = process.env.DOCS_REPO_NAME || '';
export {};
