import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface PRDiffResponse {
  diff: string;
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export async function getPRDiff(
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRDiffResponse> {
  try {
    // Get PR files
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    // Get PR diff in unified format
    const { data: diffData } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: {
        format: 'diff',
      },
    });

    return {
      diff: diffData as unknown as string,
      files: files.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      })),
    };
  } catch (error) {
    console.error('Error fetching PR diff from GitHub:', error);
    throw new Error(`Failed to fetch PR diff: ${error}`);
  }
}

export async function getPRDetails(owner: string, repo: string, prNumber: number) {
  try {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return {
      number: data.number,
      title: data.title,
      body: data.body,
      user: data.user?.login || 'unknown',
      merged_at: data.merged_at,
      additions: data.additions,
      deletions: data.deletions,
      changed_files: data.changed_files,
      html_url: data.html_url,
    };
  } catch (error) {
    console.error('Error fetching PR details from GitHub:', error);
    throw new Error(`Failed to fetch PR details: ${error}`);
  }
}

/**
 * Get the SHA of the default branch (main/master)
 */
export async function getDefaultBranchSHA(owner: string, repo: string): Promise<string> {
  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });

    return refData.object.sha;
  } catch (error) {
    console.error('Error getting default branch SHA:', error);
    throw new Error(`Failed to get default branch SHA: ${error}`);
  }
}

/**
 * Create a new branch in the repository
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromSHA: string
): Promise<void> {
  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: fromSHA,
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    throw new Error(`Failed to create branch: ${error}`);
  }
}

/**
 * Get file content from repository
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string }> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path ${path} is not a file`);
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
  } catch (error) {
    console.error('Error getting file content:', error);
    throw new Error(`Failed to get file content: ${error}`);
  }
}

/**
 * Update or create a file in the repository
 */
export async function updateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<void> {
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha, // Required if updating existing file
    });
  } catch (error) {
    console.error('Error updating file:', error);
    throw new Error(`Failed to update file: ${error}`);
  }
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<{ url: string; number: number }> {
  try {
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });

    return {
      url: data.html_url,
      number: data.number,
    };
  } catch (error) {
    console.error('Error creating pull request:', error);
    throw new Error(`Failed to create pull request: ${error}`);
  }
}
