import { GraphQLServer } from 'graphql-yoga'
import { assign, reduce, startCase, map, get, isEmpty } from 'lodash'
import { DateTimeResolver, EmailAddressResolver, UnsignedIntResolver } from 'graphql-scalars'
import * as yup from 'yup'

const yupValidation = {
  async Mutation(resolve, root, args, context, info) {
    const mutationField = info.schema.getMutationType().getFields()[info.fieldName]
    const mutationValidationSchema = mutationField.validationSchema

    if (mutationValidationSchema) {
      let errors = []

      if (!isEmpty(get(mutationValidationSchema, 'fields.data._nodes'))) {
        const fields = mutationValidationSchema.fields.data._nodes

        await Promise.all(map(fields, async (field) => {
          try {
            await mutationValidationSchema.validateAt(`data.${field}`, args)
          } catch (error) {
            if (error instanceof yup.ValidationError) {
              errors.push({
                message: error.errors,
                field
              })
            } else {
              throw error
            }

          }

          return
        }))
      } else {
        try {
          await mutationValidationSchema.validate(args)
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            return {
              errors: [{
                message: error.errors,
                field: error.path
              }]
            }
          } else {
            throw error
          }
        }
      }

      if (errors.length > 0) return { errors }
    }

    return resolve(root, args, context, info)
  }
}

const Server = {
  async init(schema, resolvers, services) {
    const server = new GraphQLServer({
      typeDefs: schema,
      resolvers: {
        DateTime: DateTimeResolver,
        EmailAddress: EmailAddressResolver,
        UnsignedInt: UnsignedIntResolver,
        Query: reduce(
          resolvers.QueryResolvers,
          (res, val) => {
            return assign(res, val)
          },
          {}
        ),
        Mutation: reduce(
          resolvers.MutationResolvers,
          (res, val) => {
            return assign(res, val)
          },
          {}
        ),
        Subscription: reduce(
          resolvers.SubscriptionResolvers,
          (res, val) => {
            return assign(res, val)
          },
          {}
        ),
        ...reduce(
          resolvers.GraphResolvers,
          (res, val, key) => {
            const obj = {}
            obj[startCase(key.substr(key.lastIndexOf('$') + 1))] = val
            return assign(res, obj)
          },
          {}
        )
      },
      context(req) {
        return {
          ...req,
          ...services
        }
      },
      middlewares: [yupValidation]
    })

    return server
  }
}

export default Server
