from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.pull_request import PullRequest
from app.core.ai_service import trigger_pr_analysis

router = APIRouter(prefix="/api/pr", tags=["Pull Requests"])

@router.get("/{pr_node_id}")
def get_pull_request_details(pr_node_id: str, db: Session = Depends(get_db)):
    """
    根据 PR 的 Node ID 获取其详细信息和时间线事件。
    """
    pr = (
        db.query(PullRequest)
        .options(joinedload(PullRequest.events))
        .filter(PullRequest.pr_node_id == pr_node_id)
        .first()
    )
    
    if not pr:
        raise HTTPException(status_code=404, detail="Pull Request not found")
        
    # 对事件按时间升序排序
    if pr.events:
        pr.events.sort(key=lambda event: event.event_time)
        
    return pr.to_dict()

@router.post("/{pr_node_id}/analyze")
def analyze_pull_request(pr_node_id: str, db: Session = Depends(get_db)):
    """
    触发指定 PR 的 AI 评分。
    """
    try:
        analysis_result = trigger_pr_analysis(db, pr_node_id)
        return {"message": "PR AI analysis triggered successfully", "analysis_result": analysis_result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger AI analysis: {e}") 