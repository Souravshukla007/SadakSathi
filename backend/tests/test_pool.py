import threading
import time

from ml.pool import ModelPool


def test_one_copy_serialises_requests():
    pool, active, peak = ModelPool(["m"]), [0], [0]
    lock = threading.Lock()

    def work():
        with pool.acquire():
            with lock:
                active[0] += 1
                peak[0] = max(peak[0], active[0])
            time.sleep(0.05)
            with lock:
                active[0] -= 1

    threads = [threading.Thread(target=work) for _ in range(4)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert peak[0] == 1


def test_n_copies_run_in_parallel_and_never_share_a_copy():
    pool, in_use, peak = ModelPool(["a", "b", "c"]), set(), [0]
    lock = threading.Lock()

    def work():
        with pool.acquire() as m:
            with lock:
                assert m not in in_use  # a copy is never lent twice
                in_use.add(m)
                peak[0] = max(peak[0], len(in_use))
            time.sleep(0.05)
            with lock:
                in_use.discard(m)

    threads = [threading.Thread(target=work) for _ in range(6)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert peak[0] == 3


def test_waiting_too_long_answers_busy_instead_of_queueing_forever():
    import pytest
    from fastapi import HTTPException

    pool = ModelPool(["m"])
    with pool.acquire():
        with pytest.raises(HTTPException) as busy:
            with pool.acquire(timeout=0.05):
                pass
    assert busy.value.status_code == 503
    with pool.acquire(timeout=0.05):  # the copy came back after the first request finished
        pass
