/**
 * QueryBuilder for TAPD API query parameters.
 * Handles special query syntax: LIKE, LIKE_OR, EQ, NOT_EQ, CONTAINS,
 * CONTAINS_OR, USER_OR, time ranges, enum OR, negated queries.
 */
export class QueryBuilder {
  private params: Record<string, string> = {};

  add(key: string, value: string | undefined): this {
    if (value !== undefined && value !== '') {
      this.params[key] = value;
    }
    return this;
  }

  addTimeRange(field: string, value: string | undefined): this {
    // Supports: >2024-01-01, <2024-12-31, 2024-01-01~2024-06-30
    if (value !== undefined && value !== '') {
      this.params[field] = value;
    }
    return this;
  }

  addEnumOr(field: string, values: string[] | string | undefined): this {
    if (values !== undefined && values !== '') {
      const joined = Array.isArray(values) ? values.join('|') : values;
      this.params[field] = joined;
    }
    return this;
  }

  addLike(field: string, value: string | undefined): this {
    if (value !== undefined && value !== '') {
      this.params[field] = `LIKE<${value}>`;
    }
    return this;
  }

  addLikeOr(field: string, values: string[] | undefined): this {
    if (values !== undefined && values.length > 0) {
      this.params[field] = `LIKE_OR<${values.join('|')}>`;
    }
    return this;
  }

  addNotEq(field: string, value: string | undefined): this {
    if (value !== undefined && value !== '') {
      this.params[field] = `NOT_EQ<${value}>`;
    }
    return this;
  }

  addUserOr(field: string, values: string[] | undefined): this {
    if (values !== undefined && values.length > 0) {
      this.params[field] = `USER_OR<${values.join('|')}>`;
    }
    return this;
  }

  addMultiId(field: string, ids: string[] | string | undefined): this {
    if (ids !== undefined && ids !== '') {
      const joined = Array.isArray(ids) ? ids.join(',') : ids;
      this.params[field] = joined;
    }
    return this;
  }

  addFields(fields: string[] | undefined): this {
    if (fields !== undefined && fields.length > 0) {
      this.params['fields'] = fields.join(',');
    }
    return this;
  }

  addPagination(limit?: number, page?: number): this {
    if (limit !== undefined) this.params['limit'] = String(Math.min(limit, 200));
    if (page !== undefined) this.params['page'] = String(Math.max(page, 1));
    return this;
  }

  build(): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(this.params)) {
      searchParams.append(key, value);
    }
    return searchParams.toString();
  }

  reset(): this {
    this.params = {};
    return this;
  }
}