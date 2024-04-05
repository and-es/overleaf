const Settings = require('@overleaf/settings')
const { callbackifyAll } = require('@overleaf/promise-utils')
const projectHistoryKeys = Settings.redis?.project_history?.key_schema
const rclient = require('@overleaf/redis-wrapper').createClient(
  Settings.redis.project_history
)
const logger = require('@overleaf/logger')
const metrics = require('./Metrics')
const { docIsTooLarge } = require('./Limits')
const OError = require('@overleaf/o-error')

const ProjectHistoryRedisManager = {
  async queueOps(projectId, ...ops) {
    // Record metric for ops pushed onto queue
    for (const op of ops) {
      metrics.summary('redis.projectHistoryOps', op.length, { status: 'push' })
    }
    const multi = rclient.multi()
    // Push the ops onto the project history queue
    multi.rpush(
      projectHistoryKeys.projectHistoryOps({ project_id: projectId }),
      ...ops
    )
    // To record the age of the oldest op on the queue set a timestamp if not
    // already present (SETNX).
    multi.setnx(
      projectHistoryKeys.projectHistoryFirstOpTimestamp({
        project_id: projectId,
      }),
      Date.now()
    )
    const result = await multi.exec()
    return result[0]
  },

  async queueRenameEntity(
    projectId,
    projectHistoryId,
    entityType,
    entityId,
    userId,
    projectUpdate,
    source
  ) {
    projectUpdate = {
      pathname: projectUpdate.pathname,
      new_pathname: projectUpdate.newPathname,
      meta: {
        user_id: userId,
        ts: new Date(),
      },
      version: projectUpdate.version,
      projectHistoryId,
    }
    projectUpdate[entityType] = entityId
    if (source != null) {
      projectUpdate.meta.source = source
      if (source !== 'editor') {
        projectUpdate.meta.type = 'external'
      }
    }

    logger.debug(
      { projectId, projectUpdate },
      'queue rename operation to project-history'
    )
    const jsonUpdate = JSON.stringify(projectUpdate)

    return await ProjectHistoryRedisManager.queueOps(projectId, jsonUpdate)
  },

  async queueAddEntity(
    projectId,
    projectHistoryId,
    entityType,
    entityId,
    userId,
    projectUpdate,
    source
  ) {
    projectUpdate = {
      pathname: projectUpdate.pathname,
      docLines: projectUpdate.docLines,
      url: projectUpdate.url,
      meta: {
        user_id: userId,
        ts: new Date(),
      },
      version: projectUpdate.version,
      projectHistoryId,
    }
    projectUpdate[entityType] = entityId
    if (source != null) {
      projectUpdate.meta.source = source
      if (source !== 'editor') {
        projectUpdate.meta.type = 'external'
      }
    }

    logger.debug(
      { projectId, projectUpdate },
      'queue add operation to project-history'
    )
    const jsonUpdate = JSON.stringify(projectUpdate)

    return await ProjectHistoryRedisManager.queueOps(projectId, jsonUpdate)
  },

  async queueResyncProjectStructure(projectId, projectHistoryId, docs, files) {
    logger.debug({ projectId, docs, files }, 'queue project structure resync')
    const projectUpdate = {
      resyncProjectStructure: { docs, files },
      projectHistoryId,
      meta: {
        ts: new Date(),
      },
    }
    const jsonUpdate = JSON.stringify(projectUpdate)
    return await ProjectHistoryRedisManager.queueOps(projectId, jsonUpdate)
  },

  async queueResyncDocContent(
    projectId,
    projectHistoryId,
    docId,
    lines,
    version,
    pathname
  ) {
    logger.debug(
      { projectId, docId, lines, version, pathname },
      'queue doc content resync'
    )
    const projectUpdate = {
      resyncDocContent: {
        content: lines.join('\n'),
        version,
      },
      projectHistoryId,
      path: pathname,
      doc: docId,
      meta: {
        ts: new Date(),
      },
    }
    const jsonUpdate = JSON.stringify(projectUpdate)
    // Do an optimised size check on the docLines using the serialised
    // project update length as an upper bound
    const sizeBound = jsonUpdate.length
    if (docIsTooLarge(sizeBound, lines, Settings.max_doc_length)) {
      throw new OError(
        'blocking resync doc content insert into project history queue: doc is too large',
        { projectId, docId, docSize: sizeBound }
      )
    }
    return await ProjectHistoryRedisManager.queueOps(projectId, jsonUpdate)
  },
}

module.exports = {
  ...callbackifyAll(ProjectHistoryRedisManager),
  promises: ProjectHistoryRedisManager,
}
