import { Octokit } from '@octokit/rest';

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.warn('GITHUB_TOKEN not set');
}

export const octokit = token ? new Octokit({ auth: token }) : null;

export const DOCS_REPO_OWNER = process.env.DOCS_REPO_OWNER || '';
export const DOCS_REPO_NAME = process.env.DOCS_REPO_NAME || '';
