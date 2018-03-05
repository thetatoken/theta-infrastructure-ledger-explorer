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

#ifdef __cplusplus
extern "C" {
#endif

#if !defined(_MSC_VER)
#include <dirent.h>

typedef struct as_dir_s {
	DIR* dir;
	struct dirent* entry;
} as_dir;

static inline bool
as_dir_exists(const char* directory)
{
	DIR* dir = opendir(directory);

	if (dir) {
		closedir(dir);
		return true;
	}
	return false;
}

static inline bool
as_dir_open(as_dir* dir, const char* directory)
{
	dir->dir = opendir(directory);
	return dir->dir != NULL;
}

static inline const char*
as_dir_read(as_dir* dir)
{
	dir->entry = readdir(dir->dir);
	if (!dir->entry || !dir->entry->d_name[0]) {
		return NULL;
	}
	return dir->entry->d_name;
}

static inline void
as_dir_close(as_dir* dir)
{
	closedir(dir->dir);
}

#else  // _MSC_VER

#define WIN32_LEAN_AND_MEAN
#include <windows.h>

typedef struct as_dir_s {
	WIN32_FIND_DATAA dir;
	HANDLE hFind;
	const char* entry;
} as_dir;

static inline bool
as_dir_exists(const char* directory)
{
	DWORD attr = GetFileAttributesA(directory);
	return attr != INVALID_FILE_ATTRIBUTES && (attr & FILE_ATTRIBUTE_DIRECTORY);
}

static inline bool
as_dir_open(as_dir* dir, const char* directory)
{
	dir->hFind = FindFirstFileA(directory, &dir->dir);

	if (dir->hFind == INVALID_HANDLE_VALUE) {
		return false;
	}

	dir->entry = dir->dir.cFileName;
	return true;
}

static inline const char*
as_dir_read(as_dir* dir)
{
	const char* entry = dir->entry;

	if (!entry) {
		return NULL;
	}

	if (FindNextFileA(dir->hFind, &dir->dir) && dir->dir.cFileName[0]) {
		dir->entry = dir->dir.cFileName;
	}
	else {
		dir->entry = NULL;
	}
	return entry;
}

static inline void
as_dir_close(as_dir* dir)
{
	FindClose(dir->hFind);
}
	
#endif

#ifdef __cplusplus
} // end extern "C"
#endif
