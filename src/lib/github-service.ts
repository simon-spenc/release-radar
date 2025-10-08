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
