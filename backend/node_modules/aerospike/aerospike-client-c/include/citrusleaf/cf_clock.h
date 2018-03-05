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

#include <aerospike/as_std.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

/******************************************************************************
 * TYPES & CONSTANTS
 ******************************************************************************/

typedef uint64_t cf_clock;
	
#define CITRUSLEAF_EPOCH 1262304000
#define CITRUSLEAF_EPOCH_MS (CITRUSLEAF_EPOCH * 1000ULL)
#define CITRUSLEAF_EPOCH_US (CITRUSLEAF_EPOCH * 1000000ULL)
#define CITRUSLEAF_EPOCH_NS (CITRUSLEAF_EPOCH * 1000000000ULL)

/******************************************************************************
 * LINUX INLINE FUNCTIONS
 ******************************************************************************/

#if defined(__linux__)

// MONOTONIC

static inline cf_clock
cf_getns()
{
	struct timespec ts;
	clock_gettime(CLOCK_MONOTONIC, &ts);
	return (ts.tv_sec * 1000 * 1000 * 1000) + ts.tv_nsec;
}

static inline cf_clock
cf_getus()
{
	struct timespec ts;
	clock_gettime(CLOCK_MONOTONIC, &ts);
	return (ts.tv_sec * 1000 * 1000) + (ts.tv_nsec / 1000);
}

static inline cf_clock
cf_getms()
{
	struct timespec ts;
	clock_gettime(CLOCK_MONOTONIC, &ts);
	return (ts.tv_sec * 1000) + (ts.tv_nsec / (1000 * 1000));
}

static inline cf_clock
cf_get_seconds()
{
	struct timespec ts;
	clock_gettime(CLOCK_MONOTONIC, &ts);
	return ts.tv_sec;
}

// WALL CLOCK (system epoch)

static inline cf_clock
cf_clock_getabsolute()  // wall clock time in milliseconds
{
	struct timespec ts;
	clock_gettime(CLOCK_REALTIME, &ts);
	return (ts.tv_sec * 1000) + (ts.tv_nsec / (1000 * 1000));
}

static inline void
cf_set_wait_timespec(int ms_wait, struct timespec* out)
{
	clock_gettime(CLOCK_REALTIME, out);
	out->tv_sec += ms_wait / 1000;
	out->tv_nsec += (ms_wait % 1000) * 1000 * 1000;

	if (out->tv_nsec > (1000 * 1000 * 1000)) {
		out->tv_nsec -= 1000 * 1000 * 1000;
		out->tv_sec++;
	}
}

static inline void
cf_clock_current_add(struct timespec* delta, struct timespec* out)
{
	clock_gettime(CLOCK_REALTIME, out);
	out->tv_sec += delta->tv_sec;
	out->tv_nsec += delta->tv_nsec;

	if (out->tv_nsec > (1000 * 1000 * 1000)) {
		out->tv_nsec -= 1000 * 1000 * 1000;
		out->tv_sec++;
	}
}
	
// WALL CLOCK (citrusleaf epoch)

static inline cf_clock
cf_clepoch_milliseconds()
{
	struct timespec ts;
	clock_gettime(CLOCK_REALTIME, &ts);
	return (ts.tv_sec * 1000) + (ts.tv_nsec / (1000 * 1000)) - CITRUSLEAF_EPOCH_MS;
}

static inline cf_clock
cf_secs_since_clepoch()
{
	struct timespec ts;
	clock_gettime(CLOCK_REALTIME, &ts);
	return ts.tv_sec - CITRUSLEAF_EPOCH;
}

#else

/******************************************************************************
 * APPLE INLINE FUNCTIONS
 ******************************************************************************/

#if defined(__APPLE__)

#include <mach/mach.h>
#include <mach/mach_time.h>
#include <sys/time.h>

// MONOTONIC

static inline cf_clock
cf_getns()
{
	// mach_absolute_time() currently returns nanoseconds, but is not
	// guaranteed to do so. This code may have to be revised at a later date.
	return mach_absolute_time();
}

// WALL CLOCK (system epoch)

static inline cf_clock
cf_clock_getabsolute()  // wall clock time in milliseconds
{
	struct timeval tv;
	gettimeofday(&tv, NULL);
	return (tv.tv_sec * 1000) + (tv.tv_usec / 1000);
}

static inline void
cf_set_wait_timespec(int ms_wait, struct timespec* out)
{
	// Has slightly less resolution than the pure linux version.
	struct timeval now;
	gettimeofday(&now, NULL);
	out->tv_sec = now.tv_sec + (ms_wait / 1000);
	out->tv_nsec = now.tv_usec * 1000 + (ms_wait % 1000) * 1000 * 1000;

	if (out->tv_nsec > (1000 * 1000 * 1000)) {
		out->tv_nsec -= 1000 * 1000 * 1000;
		out->tv_sec++;
	}
}

static inline void
cf_clock_current_add(struct timespec* delta, struct timespec* out)
{
	// Has slightly less resolution than the pure linux version.
	struct timeval now;
	gettimeofday(&now, NULL);
	out->tv_sec = now.tv_sec + delta->tv_sec;
	out->tv_nsec = now.tv_usec * 1000 + delta->tv_nsec;

	if (out->tv_nsec > (1000 * 1000 * 1000)) {
		out->tv_nsec -= 1000 * 1000 * 1000;
		out->tv_sec++;
	}
}

// WALL CLOCK (citrusleaf epoch)

static inline cf_clock
cf_clepoch_milliseconds()
{
	struct timeval tv;
	gettimeofday(&tv, NULL);
	return (tv.tv_sec * 1000) + (tv.tv_usec / 1000) - CITRUSLEAF_EPOCH_MS;
}

static inline cf_clock
cf_secs_since_clepoch()
{
	struct timeval tv;
	gettimeofday(&tv, NULL);
	return tv.tv_sec - CITRUSLEAF_EPOCH;
}

/******************************************************************************
 * MICROSOFT INLINE FUNCTIONS
 ******************************************************************************/

#elif defined(_MSC_VER)

#if defined(WIN32_LEAN_AND_MEAN)
#include <windows.h>
#else
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#undef WIN32_LEAN_AND_MEAN
#endif

AS_EXTERN extern double cf_clock_freq;
AS_EXTERN extern int64_t cf_clock_start;
AS_EXTERN extern uint64_t cf_wall_clock_start;

// MONOTONIC

static inline cf_clock
cf_getns()
{
	LARGE_INTEGER t;
	QueryPerformanceCounter(&t);
	return (uint64_t)((t.QuadPart - cf_clock_start) / cf_clock_freq);
}

// WALL CLOCK (system epoch)

static inline cf_clock
cf_clock_getabsolute()  // wall clock time in milliseconds
{
	FILETIME f;
	GetSystemTimeAsFileTime(&f);

	// Convert 100 nanosecond units to milliseconds.
	uint64_t val = ((uint64_t)f.dwHighDateTime << 32) + (uint64_t)f.dwLowDateTime;
	return (val - cf_wall_clock_start) / (10 * 1000);
}

static inline void
cf_set_wait_timespec(int ms_wait, struct timespec* out)
{
	// Has slightly less resolution than the pure linux version.
	FILETIME f;
	GetSystemTimeAsFileTime(&f);

	// Convert 100 nanosecond units to nanoseconds and add wait.
	uint64_t nanos = ((((uint64_t)f.dwHighDateTime << 32) + (uint64_t)f.dwLowDateTime - cf_wall_clock_start) * 100) +
					 (ms_wait * 1000 * 1000);

	out->tv_sec = nanos / (1000 * 1000 * 1000);
	out->tv_nsec = nanos % (1000 * 1000 * 1000);
}

static inline void
cf_clock_current_add(struct timespec* delta, struct timespec* out)
{
	// Has slightly less resolution than the pure linux version.
	FILETIME f;
	GetSystemTimeAsFileTime(&f);

	// Convert 100 nanosecond units to nanoseconds.
	uint64_t nanos = (((uint64_t)f.dwHighDateTime << 32) + (uint64_t)f.dwLowDateTime - cf_wall_clock_start) * 100;

	out->tv_sec = nanos / (1000 * 1000 * 1000) + delta->tv_sec;
	out->tv_nsec = (nanos % (1000 * 1000 * 1000)) + delta->tv_nsec;

	if (out->tv_nsec > (1000 * 1000 * 1000)) {
		out->tv_nsec -= 1000 * 1000 * 1000;
		out->tv_sec++;
	}
}

// WALL CLOCK (citrusleaf epoch)

static inline cf_clock
cf_clepoch_milliseconds()
{
	FILETIME f;
	GetSystemTimeAsFileTime(&f);

	// Convert 100 nanosecond units to milliseconds.
	uint64_t val = ((uint64_t)f.dwHighDateTime << 32) + (uint64_t)f.dwLowDateTime;
	return ((val - cf_wall_clock_start) / (10 * 1000)) - CITRUSLEAF_EPOCH_MS;
}

static inline cf_clock
cf_secs_since_clepoch()
{
	FILETIME f;
	GetSystemTimeAsFileTime(&f);

	// Convert 100 nanosecond units to seconds.
	uint64_t val = ((uint64_t)f.dwHighDateTime << 32) + (uint64_t)f.dwLowDateTime;
	return ((val - cf_wall_clock_start) / (10 * 1000 * 1000)) - CITRUSLEAF_EPOCH;
}
	
#endif

/******************************************************************************
 * APPLE AND MICROSOFT INLINE FUNCTIONS
 ******************************************************************************/

// MONOTONIC

static inline cf_clock
cf_getus()
{
	return cf_getns() / 1000;
}

static inline cf_clock
cf_getms()
{
	return cf_getns() / (1000 * 1000);
}

static inline cf_clock
cf_get_seconds()
{
	return cf_getns() / (1000 * 1000 * 1000);
}

#endif

/******************************************************************************
 * COMMON FUNCTIONS
 ******************************************************************************/

 // Required on windows only.  Should be called once on dll initialization. 
bool
cf_clock_init();

static inline void
cf_clock_set_timespec_ms(int ms, struct timespec* out)
{
	out->tv_sec = ms / 1000;
	out->tv_nsec = (ms % 1000) * 1000 * 1000;
}

// Convert from UTC nanosecond times to Citrusleaf epoch times.
// UTC nanosecond times before the Citrusleaf epoch are floored to return 0.
static inline uint64_t
cf_clepoch_ns_from_utc_ns(uint64_t utc_ns)
{
	return utc_ns > CITRUSLEAF_EPOCH_NS ? utc_ns - CITRUSLEAF_EPOCH_NS : 0;
}

static inline uint64_t
cf_clepoch_us_from_utc_ns(uint64_t utc_ns)
{
	return cf_clepoch_ns_from_utc_ns(utc_ns) / 1000;
}

static inline uint64_t
cf_clepoch_ms_from_utc_ns(uint64_t utc_ns)
{
	return cf_clepoch_ns_from_utc_ns(utc_ns) / 1000000;
}

static inline uint64_t
cf_clepoch_sec_from_utc_ns(uint64_t utc_ns)
{
	return cf_clepoch_ns_from_utc_ns(utc_ns) / 1000000000;
}

// Convert from Citrusleaf epoch times to UTC nanosecond times.
// Citrusleaf epoch times that cause overflow of uint64_t are not detected.
static inline uint64_t
cf_utc_ns_from_clepoch_ns(uint64_t clepoch_ns)
{
	return CITRUSLEAF_EPOCH_NS + clepoch_ns;
}

static inline uint64_t
cf_utc_ns_from_clepoch_us(uint64_t clepoch_us)
{
	return CITRUSLEAF_EPOCH_NS + (clepoch_us * 1000);
}

static inline uint64_t
cf_utc_ns_from_clepoch_ms(uint64_t clepoch_ms)
{
	return CITRUSLEAF_EPOCH_NS + (clepoch_ms * 1000000);
}

static inline uint64_t
cf_utc_ns_from_clepoch_sec(uint64_t clepoch_sec)
{
	return CITRUSLEAF_EPOCH_NS + (clepoch_sec * 1000000000);
}

static inline uint32_t
cf_clepoch_seconds()
{
	return (uint32_t)cf_secs_since_clepoch();
}

// Special client-only conversion utility.
static inline uint32_t
cf_server_void_time_to_ttl(uint32_t server_void_time)
{
	// This is the server's flag indicating the record never expires...
	if (server_void_time == 0) {
		// ... converted to the new client-side convention for "never expires":
		return (uint32_t)-1;
	}

	uint32_t now = cf_clepoch_seconds();

	// Record may not have expired on server, but delay or clock differences may
	// cause it to look expired on client. (We give the record to the app anyway
	// to avoid internal cleanup complications.) Floor at 1, not 0, to avoid old
	// "never expires" interpretation.
	return server_void_time > now ? server_void_time - now : 1;
}

#ifdef __cplusplus
} // end extern "C"
#endif
