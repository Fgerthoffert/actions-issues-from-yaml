import * as core from '@actions/core'
import { createGitHubMilestone } from './createGitHubMilestone.js'

export function areReposValid(
  configRepos: string[],
  gitHubRepos: GitHubRepo[]
): boolean {
  if (configRepos.length !== gitHubRepos.length) {
    const missingRepos = configRepos.filter(
      (repo) => !gitHubRepos.find((gitHubRepo) => gitHubRepo.full_name === repo)
    )
    core.warning(
      `Missing repositories detected: ${JSON.stringify(missingRepos)}, aborted issue creation.`
    )
    return false
  }
  return true
}

export function areIssueTypesValid(
  configIssueTypes: ConfigIssueType[],
  gitHubIssueTypes: GitHubIssueType[]
): boolean {
  let issueTypesError = 0
  for (const issueType of configIssueTypes) {
    if (
      !gitHubIssueTypes.find(
        (it) =>
          it.name === issueType.name &&
          it.repository.full_name === issueType.repository
      )
    ) {
      core.warning(
        `Issue Type ${issueType.name} not found in repository ${issueType.repository}`
      )
      issueTypesError++
    }
  }
  if (issueTypesError > 0) {
    return false
  }
  return true
}

export async function areMilestonesValid(
  configMilestones: ConfigMilestone[],
  gitHubMilestones: GitHubMilestone[],
  createMilestones: boolean
): Promise<boolean> {
  let error = 0
  for (const milestone of configMilestones) {
    if (
      !gitHubMilestones.find(
        (m) =>
          m.title === milestone.title &&
          m.repository.full_name === milestone.repository
      )
    ) {
      if (createMilestones) {
        core.info(
          `Milestone ${milestone.title} in repository ${milestone.repository} is missing, creating it.`
        )
        await createGitHubMilestone(milestone.title, milestone.repository)
      } else {
        core.warning(
          `Milestone ${milestone.title} not found in repository ${milestone.repository}`
        )
        error++
      }
    }
  }
  if (error > 0) {
    return false
  }
  return true
}

export async function areProjectsValid(
  configProjects: ConfigProject[],
  gitHubProjects: GitHubProject[]
): Promise<boolean> {
  let error = 0
  for (const project of configProjects) {
    if (!gitHubProjects.find((p) => p.title === project.title)) {
      core.warning(
        `Project "${project.title}" not found in the organization or user without sufficient privileges`
      )
      error++
    }
  }
  if (error > 0) {
    return false
  }
  return true
}
