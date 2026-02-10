import requests
import datetime
import time

BASE_URL = "http://localhost:5000/api/tasks"

def create_task(title, due_date=None, priority="Medium"):
    payload = {
        "title": title,
        "priority": priority
    }
    if due_date:
        payload["due_date"] = due_date
    
    resp = requests.post(BASE_URL, json=payload)
    return resp.json()

def update_task(task_id, data):
    resp = requests.put(f"{BASE_URL}/{task_id}", json=data)
    return resp.json()

def get_tasks(view=None):
    url = BASE_URL
    if view:
        url += f"?view={view}"
    resp = requests.get(url)
    return resp.json()

def clean_all():
    tasks = get_tasks()
    for t in tasks:
        requests.delete(f"{BASE_URL}/{t['id']}")

def run_tests():
    print("Cleaning DB...")
    clean_all()

    now = datetime.datetime.now(datetime.timezone.utc)
    yesterday = now - datetime.timedelta(days=1)
    tomorrow = now + datetime.timedelta(days=1)

    print("\n1. creating tasks...")
    # T1: Overdue (Yesterday)
    t1 = create_task("Overdue Task", yesterday.isoformat())
    print(f"Created T1 (Overdue): {t1['id']}")

    # T2: Upcoming (Tomorrow)
    t2 = create_task("Upcoming Task", tomorrow.isoformat())
    print(f"Created T2 (Upcoming): {t2['id']}")

    # T3: Today (Now + 1 hour)
    t3 = create_task("Today Task", (now + datetime.timedelta(hours=1)).isoformat())
    print(f"Created T3 (Today): {t3['id']}")

    print("\n2. Verifying Views...")
    
    all_tasks = get_tasks()
    print(f"All Tasks: {len(all_tasks)} (Expected 3)")
    
    # Verify Status calculation in list
    t1_fetch = next(t for t in all_tasks if t['id'] == t1['id'])
    if t1_fetch['status'] == 'Overdue':
        print("PASS: T1 is Overdue")
    else:
        print(f"FAIL: T1 status is {t1_fetch['status']}")

    # Verify 'overdue' view
    overdue = get_tasks(view="overdue")
    if len(overdue) == 1 and overdue[0]['id'] == t1['id']:
        print("PASS: Overdue view returns T1")
    else:
        print(f"FAIL: Overdue view returned {[t['id'] for t in overdue]}")

    # Verify 'upcoming' view
    upcoming = get_tasks(view="upcoming")
    # Upcoming logic: due_date > EOD Today. 
    # T2 is tomorrow. T3 is Today (1 hour from now).
    # So Upcoming should have T2 only.
    if len(upcoming) == 1 and upcoming[0]['id'] == t2['id']:
        print("PASS: Upcoming view returns T2")
    else:
        print(f"FAIL: Upcoming view returned {[t['id'] for t in upcoming]}")

    # Verify 'today' view
    today_view = get_tasks(view="today")
    # Today logic: due_date <= EOD Today AND Not Completed
    # Should include T1 (Overdue is usually separate or included? 
    # Logic in app.py: due_date >= today_start AND due_date <= today_end.
    # So T1 (Yesterday) should NOT be in Today view.
    # T3 should be in Today view.
    
    # Wait, my logic in app.py for 'today' was: >= today_start AND <= today_end.
    # So Overdue (yesterday) is NOT in Today. Correct.
    if len(today_view) == 1 and today_view[0]['id'] == t3['id']:
        print("PASS: Today view returns T3")
    else:
        print(f"FAIL: Today view returned {[t['id'] for t in today_view]}")


    print("\n3. Verifying Completion & Late...")
    # Complete T1 (which was overdue)
    update_task(t1['id'], {"completed": True})
    
    t1_updated = requests.get(f"{BASE_URL}").json() # get list to see computed fields
    t1_final = next(t for t in t1_updated if t['id'] == t1['id'])
    
    if t1_final['status'] == 'Completed':
         print("PASS: T1 status is Completed")
    else:
         print(f"FAIL: T1 status is {t1_final['status']}")

    if t1_final['is_late'] == True:
        print("PASS: T1 is marked Late")
    else:
        print(f"FAIL: T1 is_late is {t1_final['is_late']}")

    # Verify 'completed' view
    completed_view = get_tasks(view="completed")
    if len(completed_view) == 1 and completed_view[0]['id'] == t1['id']:
        print("PASS: Completed view returns T1")
    else:
        print(f"FAIL: Completed view returned {[t['id'] for t in completed_view]}")

if __name__ == "__main__":
    run_tests()
