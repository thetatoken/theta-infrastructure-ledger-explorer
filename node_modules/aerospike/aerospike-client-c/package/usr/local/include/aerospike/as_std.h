/* 
 * Copyright 2008-2018 Aerospike, Inc.
 *
 * Portions may be licensed to Aerospike, Inc. under one or more contributor
 * license agreements.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
#pragma once

#include <inttypes.h>
#include <stdbool.h>
#include <stdint.h>

#if ! defined(_MSC_VER)
#include <alloca.h>
#define AS_EXTERN

#else
#include <malloc.h>

#define strcasecmp _stricmp
#define strncasecmp _strnicmp
#define strtok_r strtok_s
#define __thread __declspec(thread)

#if defined(AS_SHARED_EXPORT)
#define AS_EXTERN __declspec(dllexport)
#elif defined(AS_SHARED_IMPORT)
#define AS_EXTERN __declspec(dllimport)
#else
#define AS_EXTERN
#endif

#endif
